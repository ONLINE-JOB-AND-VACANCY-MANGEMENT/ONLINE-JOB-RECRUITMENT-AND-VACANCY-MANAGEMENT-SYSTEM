<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'cover_letter' => $this->cover_letter,
            'applicant' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
            ],
            'job' => [
                'id' => $this->job?->id,
                'title' => $this->job?->title,
            ],
            'resume' => $this->resume ? [
                'id' => $this->resume->id,
                'file_path' => asset('storage/' . $this->resume->file_path),
                'original_name' => $this->resume->original_name,
            ] : null,
            'exam' => $this->exam ? [
    'id' => $this->exam->id,
    'scheduled_at' => $this->exam->scheduled_at,
    'location' => $this->exam->location,
    'mode' => $this->exam->mode,
    'status' => $this->exam->status,
    'score' => $this->exam->score,
] : null,
'interview' => $this->interview ? [
    'id' => $this->interview->id,
    'scheduled_at' => $this->interview->scheduled_at,
    'location' => $this->interview->location,
    'mode' => $this->interview->mode,
    'status' => $this->interview->status,
] : null,
            'applied_at' => $this->created_at,
        ];
    }
}