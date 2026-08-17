<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role?->name === 'job_seeker';
    }

    public function rules(): array
    {
        return [
            'cover_letter' => 'nullable|string|max:5000',
            'resume' => 'required_without:resume_id|file|mimes:pdf,doc,docx|max:5120',
            'resume_id' => 'required_without:resume|exists:resumes,id',
        ];
    }

    public function messages(): array
    {
        return [
            'authorize' => 'Only job seekers can apply to jobs.',
        ];
    }
}