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
            'category_id' => 'required|exists:categories,id',
            'department' => 'required|string|max:255',
            'job_title' => 'required|string|max:255',
            'target_hire_date' => 'nullable|date|after:today',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'justification' => 'required|string|max:5000',
        ];
    }
}