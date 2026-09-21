<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Interview extends Model
{
    protected $fillable = ['application_id', 'scheduled_at', 'location', 'mode', 'meeting_link', 'status', 'result', 'notes'];

    protected function casts(): array
    {
        return ['scheduled_at' => 'datetime', 'result' => 'decimal:2'];
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}