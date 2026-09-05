<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()->role?->name, ['employer', 'admin']);
    }

    public function rules(): array
    {
        // When posting from an approved requisition, job_title_id/job_type/requirements/
        // salary/dates/skills are all inherited by JobService::create() — HR only has to
        // confirm title + description. Posting directly (no requisition) requires HR to
        // supply everything themselves.
        $fromRequisition = $this->filled('requisition_id');

        return [
            'requisition_id' => 'nullable|exists:job_requisitions,id',
            'job_title_id' => $fromRequisition ? 'nullable|exists:job_titles,id' : 'required|exists:job_titles,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'location' => 'nullable|string|max:255',
            'job_type' => $fromRequisition ? 'nullable|in:full_time,part_time,contract,internship' : 'required|in:full_time,part_time,contract,internship',
            'workplace_type' => 'required|in:onsite,remote,hybrid',
            'experience_level' => 'required|in:entry,mid,senior,executive',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
        ];
    }
}
