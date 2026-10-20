<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CustomRequest extends Model
{
    public const STATUSES = ['new' => 'New', 'in_progress' => 'In progress', 'done' => 'Done', 'closed' => 'Closed'];

    protected $fillable = ['name', 'phone', 'email', 'piece_type', 'metal', 'budget', 'details', 'reference_image', 'status', 'admin_notes'];
}
