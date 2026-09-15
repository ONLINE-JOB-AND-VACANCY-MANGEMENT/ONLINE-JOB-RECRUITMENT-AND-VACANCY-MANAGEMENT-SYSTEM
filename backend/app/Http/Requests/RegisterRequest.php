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
            // Required, not optional, per the latest requirements — a job seeker must
            // provide their full name breakdown and a phone number at registration.
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
            'first_name' => 'required|string|max:255',
            'middle_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
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
