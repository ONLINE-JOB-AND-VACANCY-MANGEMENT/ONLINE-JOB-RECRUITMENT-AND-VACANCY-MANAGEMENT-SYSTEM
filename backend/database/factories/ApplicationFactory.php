<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\Job;
use Illuminate\Database\Eloquent\Factories\Factory;

class ApplicationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'job_posting_id' => Job::factory(),
            'cover_letter' => fake()->paragraph(),
            'status' => fake()->randomElement(['applied', 'shortlisted', 'interviewing', 'hired', 'rejected']),
        ];
    }
}