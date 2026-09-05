<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any HR (employer) account or admin manages any job — single-organization system.
        return in_array($this->user()->role?->name, ['admin', 'employer']);
    }

    public function rules(): array
    {
        return [
            'job_title_id'     => 'sometimes|exists:job_titles,id',
            'title'            => 'sometimes|string|max:255',
            'description'      => 'sometimes|string',
            'requirements'     => 'nullable|string',
            'salary_min'       => 'nullable|numeric|min:0',
            'salary_max'       => 'nullable|numeric|gte:salary_min',
            'location'         => 'nullable|string|max:255',
            'job_type'         => 'sometimes|in:full_time,part_time,contract,internship',
            'workplace_type'   => 'sometimes|in:onsite,remote,hybrid',
            'experience_level' => 'sometimes|in:entry,mid,senior,executive',
            'status'           => 'sometimes|in:open,closed,draft',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date|after_or_equal:start_date',
            'skills'           => 'nullable|array',
            'skills.*'         => 'exists:skills,id',
        ];
    }
}
