<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'employer' && $this->user()->company !== null;
    }

    public function rules(): array
    {
        return [
            'category_id' => 'required|exists:categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'requirements' => 'nullable|string',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'location' => 'nullable|string|max:255',
            'job_type' => 'required|in:full_time,part_time,contract,internship,remote',
            'experience_level' => 'required|in:entry,mid,senior,executive',
            'deadline' => 'nullable|date|after:today',
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
        ];
    }

    public function messages(): array
    {
        return [
            'authorize' => 'Only employers with a company profile can post jobs.',
        ];
    }
}