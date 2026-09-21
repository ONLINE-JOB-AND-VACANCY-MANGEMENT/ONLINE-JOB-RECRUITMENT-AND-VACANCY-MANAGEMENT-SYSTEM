<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'admin';
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'father_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'regex:/^[a-z0-9]+(?:\.[a-z0-9]+)*@aastu\.edu\.net$/i',
            ],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => 'required|in:employer,manager',
            'phone' => ['required', 'string', 'regex:/^(?:09\d{8}|07\d{8}|\+2519\d{8}|\+2717\d{8})$/'],
            // users.department_id already existed in the schema but wasn't collected
            // anywhere — this is the "admin department picker" item from the handoff
            // roadmap (§8). Only meaningful for managers, but kept simply nullable
            // rather than conditionally required so an HR account can still be created
            // without one.
            'department_id' => 'nullable|exists:departments,id',
        ];
    }
}
