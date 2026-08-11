<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'role_id' => Role::factory(),
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => Hash::make('password'),
            'phone' => fake()->phoneNumber(),
            'address' => fake()->address(),
            'is_active' => true,
            'remember_token' => \Illuminate\Support\Str::random(10),
        ];
    }

    public function jobSeeker(): static
    {
        return $this->state(fn () => ['role_id' => Role::where('name', 'job_seeker')->first()?->id ?? Role::factory()]);
    }

    public function employer(): static
    {
        return $this->state(fn () => ['role_id' => Role::where('name', 'employer')->first()?->id ?? Role::factory()]);
    }
}