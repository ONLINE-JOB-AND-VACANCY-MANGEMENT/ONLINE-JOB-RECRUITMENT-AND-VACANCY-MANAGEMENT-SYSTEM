<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => 'required|in:job_seeker',
            // The single full-name field must contain the applicant's first, middle,
            // and last names.
            'phone' => ['required', 'string', 'regex:/^(?:09\d{8}|07\d{8}|\+2519\d{8}|\+2717\d{8})$/'],
            'address' => 'nullable|string|max:255',
            'cgpa' => 'nullable|numeric|min:0|max:4',
            'graduation_university' => 'nullable|string|max:255',
            'worked_company' => 'nullable|string|max:255',
            'bio' => 'nullable|string|max:2000',
            'skills' => 'nullable|string|max:2000',
            'certificates' => 'nullable|array|max:10',
            'certificates.*.title' => 'required_with:certificates|string|max:255',
            'certificates.*.url' => 'nullable|url|max:2048',
        ];
    }
}
