<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassroomStudent extends Model
{
    protected $fillable = [
        'classroom_id',
        'mahasiswa_id',
    ];
}
