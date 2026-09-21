<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DocumentRequest extends Model
{
    protected $fillable = ['application_id', 'required_documents', 'submitted_documents', 'deadline', 'location', 'announcement', 'supplied_at', 'proven_at'];

    protected function casts(): array
    {
        return [
            'required_documents' => 'array',
            'submitted_documents' => 'array',
            'deadline' => 'datetime',
            'supplied_at' => 'datetime',
            'proven_at' => 'datetime',
        ];
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }

    public function isExpired(): bool
    {
        return ! $this->proven_at && $this->deadline->isPast();
    }
}
