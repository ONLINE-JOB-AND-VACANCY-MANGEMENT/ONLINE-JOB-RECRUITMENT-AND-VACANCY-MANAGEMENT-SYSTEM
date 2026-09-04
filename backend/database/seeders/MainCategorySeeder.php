<?php

namespace Database\Seeders;

use App\Models\MainCategory;
use Illuminate\Database\Seeder;

class MainCategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach (['Admin', 'Academic'] as $name) {
            MainCategory::firstOrCreate(['name' => $name]);
        }
    }
}
