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
            'experience_level' => $this->experience_level,
            'status' => $this->status,
            'deadline' => $this->deadline,
            'company' => [
                'id' => $this->company?->id,
                'name' => $this->company?->name,
                'logo' => $this->company?->logo,
                'location' => $this->company?->location,
            ],
            'category' => $this->category?->name,
            'skills' => $this->skills->pluck('name'),
            'applications_count' => $this->whenCounted('applications'),
            'created_at' => $this->created_at,
        ];
    }
}