<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = ['application_id', 'scheduled_at', 'location', 'mode', 'status', 'score', 'notes', 'deadline', 'laws_requirements'];

    protected function casts(): array
    {
        return ['scheduled_at' => 'datetime', 'score' => 'decimal:2'];
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function getResultAttribute(): ?float
    {
        return $this->score === null ? null : (float) $this->score;
    }
}