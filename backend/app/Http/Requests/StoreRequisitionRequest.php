<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'manager';
    }

    public function rules(): array
    {
        return [
            'job_title_id' => 'required|exists:job_titles,id',
            'job_type' => 'required|in:full_time,part_time,contract,internship',
            'target_hire_date' => 'nullable|date|after:today',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'justification' => 'required|string|max:5000',
            'requirements' => 'nullable|string|max:5000',
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
        ];
    }
}
