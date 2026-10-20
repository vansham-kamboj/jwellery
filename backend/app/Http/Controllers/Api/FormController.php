<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CustomRequest;
use App\Models\Subscriber;
use App\Services\ImageOptimizer;
use App\Support\Settings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/** Custom-piece requests, studio bookings and newsletter sign-ups. */
class FormController extends Controller
{
    public function customRequest(Request $request): JsonResponse
    {
        $d = $request->validate([
            'name' => 'required|string|max:120',
            'phone' => ['required', 'string', 'max:40', 'regex:/^[0-9+()\-\s.]{7,}$/'],
            'email' => 'nullable|email|max:160',
            'piece_type' => 'nullable|string|max:80',
            'metal' => 'nullable|string|max:80',
            'budget' => 'nullable|string|max:80',
            'details' => 'required|string|max:3000',
            'reference_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:8192',
            'website' => 'prohibited',
        ]);
        if ($request->hasFile('reference_image')) {
            $d['reference_image'] = app(ImageOptimizer::class)->store($request->file('reference_image'), 'requests');
        }
        unset($d['website']);
        CustomRequest::create($d);

        return response()->json(['message' => 'Thank you — we will be in touch within one business day.'], 201);
    }

    /** GET /api/bookings/slots?date=YYYY-MM-DD */
    public function slots(Request $request): JsonResponse
    {
        $d = $request->validate(['date' => 'required|date_format:Y-m-d|after_or_equal:today']);

        return response()->json(['date' => $d['date'], 'slots' => $this->freeSlots(Carbon::parse($d['date']))]);
    }

    public function book(Request $request): JsonResponse
    {
        $d = $request->validate([
            'name' => 'required|string|max:120',
            'phone' => ['required', 'string', 'max:40', 'regex:/^[0-9+()\-\s.]{7,}$/'],
            'email' => 'nullable|email|max:160',
            'date' => 'required|date_format:Y-m-d|after_or_equal:today',
            'time_slot' => 'required|string|max:10',
            'purpose' => 'nullable|string|max:120',
            'note' => 'nullable|string|max:1000',
            'website' => 'prohibited',
        ]);
        $slot = collect($this->freeSlots(Carbon::parse($d['date'])))->firstWhere('time', $d['time_slot']);
        if (! ($slot['free'] ?? false)) {
            return response()->json(['message' => 'That time was just taken — please pick another.'], 422);
        }
        unset($d['website']);
        $booking = Booking::create($d);

        return response()->json(['message' => 'Booked for '.$booking->date->format('D j M').' at '.$booking->time_slot.'.', 'id' => $booking->id], 201);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $d = $request->validate(['email' => 'required|email|max:160', 'source' => 'nullable|string|max:40', 'website' => 'prohibited']);
        Subscriber::firstOrCreate(['email' => strtolower($d['email'])], ['source' => $d['source'] ?? null]);

        return response()->json(['message' => 'You are on the list.'], 201);
    }

    private function freeSlots(Carbon $date): array
    {
        if (! in_array($date->dayOfWeek, Settings::get('booking_days'), true)) {
            return [];
        }
        $taken = Booking::whereDate('date', $date)->where('status', '!=', 'cancelled')->pluck('time_slot')->all();

        return array_map(fn ($t) => ['time' => $t, 'free' => ! in_array($t, $taken, true)], Settings::get('booking_slots'));
    }
}
