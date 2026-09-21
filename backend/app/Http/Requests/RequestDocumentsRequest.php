<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestDocumentsRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'required_documents' => ['required', 'array', 'min:1'],
            'required_documents.*' => ['required', 'string', 'max:255'],
            'deadline' => ['required', 'date', 'after:now'],
            'location' => ['required', 'string', 'max:255'],
            'announcement' => ['required', 'string', 'max:10000'],
        ];
    }
}
