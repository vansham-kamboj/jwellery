<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\CustomRequest;
use App\Models\Subscriber;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Custom-piece requests, studio bookings and newsletter subscribers. */
class InboxController extends Controller
{
    public function requests(Request $request)
    {
        $status = $request->query('status');

        return view('admin.requests', [
            'requests' => CustomRequest::when(isset(CustomRequest::STATUSES[$status]), fn ($q) => $q->where('status', $status))->latest()->paginate(20)->withQueryString(),
            'status' => $status,
        ]);
    }

    public function updateRequest(Request $request, CustomRequest $customRequest)
    {
        $customRequest->update($request->validate([
            'status' => ['required', Rule::in(array_keys(CustomRequest::STATUSES))],
            'admin_notes' => 'nullable|string|max:5000',
        ]));

        return back()->with('ok', 'Request updated.');
    }

    public function bookings(Request $request)
    {
        $past = $request->boolean('past');

        return view('admin.bookings', [
            'bookings' => Booking::when($past, fn ($q) => $q->whereDate('date', '<', today())->orderByDesc('date'),
                fn ($q) => $q->whereDate('date', '>=', today())->orderBy('date'))->orderBy('time_slot')->paginate(30)->withQueryString(),
            'past' => $past,
        ]);
    }

    public function updateBooking(Request $request, Booking $booking)
    {
        $booking->update($request->validate(['status' => ['required', Rule::in(array_keys(Booking::STATUSES))]]));

        return back()->with('ok', 'Booking updated.');
    }

    public function subscribers()
    {
        return view('admin.subscribers', ['subscribers' => Subscriber::latest()->paginate(50)]);
    }

    public function exportSubscribers()
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['email', 'source', 'joined']);
            Subscriber::orderBy('id')->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $s) {
                    fputcsv($out, [$s->email, $s->source, $s->created_at->toDateString()]);
                }
            });
            fclose($out);
        }, 'subscribers-'.now()->toDateString().'.csv', ['Content-Type' => 'text/csv']);
    }

    public function deleteSubscriber(Subscriber $subscriber)
    {
        $subscriber->delete();

        return back()->with('ok', 'Subscriber removed.');
    }
}
