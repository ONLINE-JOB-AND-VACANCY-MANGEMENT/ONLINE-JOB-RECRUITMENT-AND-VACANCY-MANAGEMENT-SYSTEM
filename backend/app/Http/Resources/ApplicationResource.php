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
            'applicant_id' => $this->user?->applicant_id,
            'semi_point' => $this->semi_point,
            'final_point' => $this->final_point,
            'cover_letter' => $this->cover_letter,
            'applicant' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
                'first_name' => $this->user?->first_name,
                'middle_name' => $this->user?->middle_name,
                'last_name' => $this->user?->last_name,
                'address' => $this->user?->address,
                'cgpa' => $this->user?->cgpa,
                'graduation_university' => $this->user?->graduation_university,
                'worked_company' => $this->user?->worked_company,
                'bio' => $this->user?->bio,
                'skills' => $this->user?->skills,
                'certificates' => $this->user?->relationLoaded('certificates') ? $this->user->certificates : [],
            ],
            'job' => [
                'id' => $this->job?->id,
                'title' => $this->job?->title,
                'end_date' => $this->job?->end_date,
            ],
            'resume' => $this->resume ? [
                'id' => $this->resume->id,
                'file_path' => asset('storage/' . $this->resume->file_path),
                'original_name' => $this->resume->original_name,
                'url' => asset('storage/' . $this->resume->file_path),
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
    'meeting_link' => $this->interview->meeting_link,
    'status' => $this->interview->status,
    'result' => $this->interview->result,
] : null,
            'document_request' => $this->documentRequest ? [
                'id' => $this->documentRequest->id,
                'required_documents' => $this->documentRequest->required_documents,
                'submitted_documents' => collect($this->documentRequest->submitted_documents ?? [])->map(fn (array $document) => [
                    'name' => $document['name'] ?? 'Document',
                    'link' => $document['link'] ?? null,
                    'file_url' => ! empty($document['file_path']) ? asset('storage/' . $document['file_path']) : null,
                ])->values(),
                'deadline' => $this->documentRequest->deadline,
                'supplied_at' => $this->documentRequest->supplied_at,
                'proven_at' => $this->documentRequest->proven_at,
            ] : null,
            'applied_at' => $this->created_at,
        ];
    }
}