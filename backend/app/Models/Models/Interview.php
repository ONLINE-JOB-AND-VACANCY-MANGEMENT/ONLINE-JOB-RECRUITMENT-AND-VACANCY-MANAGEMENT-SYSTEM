<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    protected $fillable = ['application_id', 'scheduled_at', 'location', 'mode', 'status', 'notes'];

    protected function casts(): array
    {
        return ['scheduled_at' => 'datetime'];
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}