<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'email' => $this->email,
            'role' => $this->role?->name,
            'phone' => $this->phone,
            'address' => $this->address,
            'profile_photo' => $this->profile_photo,
            'is_active' => $this->is_active,
            'must_change_password' => $this->must_change_password,
            'cgpa' => $this->cgpa,
            'graduation_university' => $this->graduation_university,
            'worked_company' => $this->worked_company,
            'bio' => $this->bio,
            'skills' => $this->skills,
            'certificates' => $this->whenLoaded('certificates', fn () => $this->certificates->map(fn ($certificate) => [
                'id' => $certificate->id,
                'title' => $certificate->title,
                'url' => $certificate->url,
                'file_path' => $certificate->file_path,
                'original_name' => $certificate->original_name,
            ])),
            // department_id is a plain column (always safe). The department NAME comes
            // from a relation, so it's guarded with whenLoaded() — that checks whether
            // 'department' was already eager-loaded and, if not, skips touching the
            // relation entirely rather than lazy-loading it (which would throw under
            // Model::preventLazyLoading() in local/dev). Controllers that want the name
            // in the response must eager-load it explicitly, e.g. ->load(['role','department']).
            'department_id' => $this->department_id,
            'department' => $this->whenLoaded('department', fn () => $this->department?->name),
            'created_at' => $this->created_at,
        ];
    }
}
