<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = ['user_id', 'title', 'url', 'file_path', 'original_name'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
