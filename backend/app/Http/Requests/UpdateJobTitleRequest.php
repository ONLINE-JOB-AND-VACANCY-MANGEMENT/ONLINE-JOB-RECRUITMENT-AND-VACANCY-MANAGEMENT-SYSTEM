<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateJobTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'employer';
    }

    public function rules(): array
    {
        return [
            'department_id' => 'required|exists:departments,id',
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('job_titles', 'name')
                    ->where(fn ($q) => $q->where('department_id', $this->department_id))
                    ->ignore($this->route('jobTitle')),
            ],
            'description' => 'nullable|string|max:10000',
            'requirements' => 'nullable|string|max:10000',
            'salary' => 'nullable|numeric|min:0',
            'salary_ranges' => 'nullable|array',
        ];
    }
}
