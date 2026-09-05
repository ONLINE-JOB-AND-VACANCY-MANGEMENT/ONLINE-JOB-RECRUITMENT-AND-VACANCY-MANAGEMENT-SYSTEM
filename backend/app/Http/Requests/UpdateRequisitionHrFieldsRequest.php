<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRequisitionHrFieldsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'employer';
    }

    public function rules(): array
    {
        return [
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|gte:salary_min',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
        ];
    }
}
