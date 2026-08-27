<?php

namespace Database\Seeders;

use App\Models\Company;
use Illuminate\Database\Seeder;

class CompanySeeder extends Seeder
{
    public function run(): void
    {
        Company::firstOrCreate(['id' => 1], [
            'name' => 'Acme Corporation',
            'description' => 'A leading company in innovative solutions.',
            'website' => 'https://acme-corp.test',
            'address' => 'Addis Ababa, Ethiopia',
        ]);
    }
}