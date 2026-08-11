<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->jobTitle(),
            'slug' => fn (array $attrs) => \Illuminate\Support\Str::slug($attrs['name']),
        ];
    }
}