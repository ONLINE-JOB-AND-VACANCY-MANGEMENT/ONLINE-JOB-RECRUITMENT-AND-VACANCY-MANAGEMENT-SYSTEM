<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            CategorySeeder::class,
            SkillSeeder::class,
            CategorySkillSeeder::class,
            UserSeeder::class,
            CompanySeeder::class,
            JobSeeder::class,
        ]);
    }
}