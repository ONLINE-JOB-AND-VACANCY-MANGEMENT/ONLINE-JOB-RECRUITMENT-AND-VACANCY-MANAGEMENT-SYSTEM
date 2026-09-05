<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDepartmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'employer';
    }

    public function rules(): array
    {
        return [
            'main_category_id' => 'required|exists:main_categories,id',
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('departments', 'name')
                    ->where(fn ($q) => $q->where('main_category_id', $this->main_category_id))
                    ->ignore($this->route('department')),
            ],
        ];
    }
}
