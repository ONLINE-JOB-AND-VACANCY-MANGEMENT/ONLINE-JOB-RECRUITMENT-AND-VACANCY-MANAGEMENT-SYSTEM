<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class CompanyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'name' => fake()->company(),
            'description' => fake()->catchPhrase(),
            'website' => fake()->url(),
            'industry' => fake()->randomElement(['Tech', 'Finance', 'Healthcare', 'Education', 'Retail']),
            'location' => fake()->city(),
        ];
    }
}