<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'employer';
    }

    public function rules(): array
    {
        return [
            'requisition_id' => 'required|exists:job_requisitions,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'location' => 'nullable|string|max:255',
            'job_type' => 'required|in:full_time,part_time,contract,internship',
            'workplace_type' => 'required|in:onsite,remote,hybrid',
            'experience_level' => 'required|in:entry,mid,senior,executive',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
        ];
    }
}