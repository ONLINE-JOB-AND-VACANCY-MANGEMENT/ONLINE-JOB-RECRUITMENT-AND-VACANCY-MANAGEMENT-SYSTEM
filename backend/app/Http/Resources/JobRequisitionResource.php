<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JobRequisitionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'job_title_id' => $this->job_title_id,
            'job_title' => $this->jobTitle?->name,
            'job_title_description' => $this->jobTitle?->description,
            'job_title_requirements' => $this->jobTitle?->requirements,
            'job_title_salary_ranges' => $this->jobTitle?->salary_ranges,
            // Plain IDs alongside the existing name strings, so the frontend can
            // pre-populate the CategoryPicker dropdowns directly when editing an
            // existing requisition instead of brute-force searching every department
            // and job-title list to find a match (AASTU-JobPortal-HANDOFF.md §6.3).
            'department_id' => $this->jobTitle?->department_id,
            'main_category_id' => $this->jobTitle?->department?->main_category_id,
            'department' => $this->jobTitle?->department?->name,
            'main_category' => $this->jobTitle?->department?->mainCategory?->name,
            'job_type' => $this->job_type,
            'target_hire_date' => $this->target_hire_date,
            'salary' => $this->salary ?? $this->salary_min ?? $this->salary_max,
            'justification' => $this->justification,
            'requirements' => $this->requirements,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'skills' => $this->skills->pluck('name'),
            'status' => $this->status,
            'requested_by' => [
                'id' => $this->requestedBy?->id,
                'name' => $this->requestedBy?->name,
            ],
            'approved_by' => $this->when($this->approved_by, [
                'id' => $this->approvedBy?->id,
                'name' => $this->approvedBy?->name,
            ]),
            'approved_at' => $this->approved_at,
            'rejection_reason' => $this->rejection_reason,
            'has_job_posting' => $this->jobPosting()->exists(),
            'created_at' => $this->created_at,
        ];
    }
}
