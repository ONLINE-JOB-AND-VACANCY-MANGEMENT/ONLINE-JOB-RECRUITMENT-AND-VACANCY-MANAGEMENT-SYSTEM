<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMainCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'employer';
    }

    public function rules(): array
    {
        return [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('main_categories', 'name')->ignore($this->route('mainCategory')),
            ],
        ];
    }
}
