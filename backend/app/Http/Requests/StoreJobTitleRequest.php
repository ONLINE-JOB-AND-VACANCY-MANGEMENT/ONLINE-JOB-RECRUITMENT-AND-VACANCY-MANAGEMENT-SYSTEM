<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJobTitleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Both HR and managers may create a job title under an existing department.
        return in_array($this->user()->role?->name, ['employer', 'manager']);
    }

    public function rules(): array
    {
        return [
            'department_id' => 'required|exists:departments,id',
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('job_titles', 'name')->where(fn ($q) => $q->where('department_id', $this->department_id)),
            ],
            'skills' => 'nullable|array',
            'skills.*' => 'exists:skills,id',
        ];
    }
}
