<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    public const STATUSES = ['booked' => 'Booked', 'done' => 'Done', 'cancelled' => 'Cancelled'];

    protected $fillable = ['name', 'phone', 'email', 'date', 'time_slot', 'purpose', 'note', 'status'];

    protected $casts = ['date' => 'date'];
}
