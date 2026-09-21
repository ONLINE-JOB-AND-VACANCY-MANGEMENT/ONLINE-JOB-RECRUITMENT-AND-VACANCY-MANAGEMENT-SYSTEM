<?php

namespace App\Services;

use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function register(array $data): array
    {
        $role = Role::where('name', $data['role'])->firstOrFail();

        $user = User::create([
            'role_id' => $role->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'phone' => $data['phone'] ?? null,
            'address' => $data['address'] ?? null,
            'cgpa' => $data['cgpa'] ?? null,
            'graduation_university' => $data['graduation_university'] ?? null,
            'worked_company' => $data['worked_company'] ?? null,
            'bio' => $data['bio'] ?? null,
            'skills' => $data['skills'] ?? null,
        ]);

        foreach ($data['certificates'] ?? [] as $certificate) {
            $user->certificates()->create([
                'title' => $certificate['title'],
                'url' => $certificate['url'] ?? null,
            ]);
        }

        // Eloquent's $with default eager-loads only apply to models resolved via a
        // query (find/where/etc.), not to one just built by create() in this same
        // request — so 'role' must be loaded explicitly here or UserResource's
        // `$this->role?->name` throws a LazyLoadingViolationException in local/dev.
        $user->load(['role', 'certificates']);

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => ['This account has been deactivated.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return ['user' => $user, 'token' => $token];
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()->delete();
    }
}
