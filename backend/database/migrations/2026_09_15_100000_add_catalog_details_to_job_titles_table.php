<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('job_titles', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->text('requirements')->nullable()->after('description');
            $table->json('salary_ranges')->nullable()->after('requirements');
        });
    }

    public function down(): void
    {
        Schema::table('job_titles', function (Blueprint $table) {
            $table->dropColumn(['description', 'requirements', 'salary_ranges']);
        });
    }
};
