<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        $job = $this->route('job');
        return $this->user()->company && $job->company_id === $this->user()->company->id;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'sometimes|exists:categories,id',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'requirements' => 'nullable|string',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'location' => 'nullable|string|max:255',
            'job_type' => 'sometimes|in:full_time,part_time,contract,internship,remote',
            'experience_level' => 'sometimes|in:entry,mid,senior,executive',
            'status' => 'sometimes|in:open,closed,draft',
            'start_date' => 'nullable|date',
'end_date' => 'nullable|date|after_or_equal:start_date',
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
        ];
    }
}