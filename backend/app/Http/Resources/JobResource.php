<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'requirements' => $this->requirements,
            'salary_min' => $this->salary_min,
            'salary_max' => $this->salary_max,
            'location' => $this->location,
            'job_type' => $this->job_type,
            'workplace_type' => $this->workplace_type,
            'experience_level' => $this->experience_level,
            'status' => $this->status,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'job_title' => $this->jobTitle?->name,
            'department' => $this->jobTitle?->department?->name,
            'main_category' => $this->jobTitle?->department?->mainCategory?->name,
            'skills' => $this->skills->pluck('name'),
            'posted_by' => $this->postedBy?->name,
            'applications_count' => $this->whenCounted('applications'),
            'is_bookmarked' => $request->user()?->role?->name === 'job_seeker'
                ? $this->bookmarks->contains('user_id', $request->user()->id)
                : false,
            'created_at' => $this->created_at,
        ];
    }
}
