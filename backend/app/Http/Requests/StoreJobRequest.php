<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobRequest extends FormRequest
{
public function authorize(): bool
{
    $user = $this->user();
    if ($user->role?->name === 'employer') {
        return $user->company !== null;
    }
    return $user->role?->name === 'admin';
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
            'start_date' => 'nullable|date',
'end_date' => 'nullable|date|after_or_equal:start_date',
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
            'company_id' => $this->user()->role?->name === 'admin' ? 'required|exists:companies,id' : 'nullable',
        ];
    }

    public function messages(): array
    {
        return [
            'authorize' => 'Only employers with a company profile can post jobs.',
        ];
    }
}