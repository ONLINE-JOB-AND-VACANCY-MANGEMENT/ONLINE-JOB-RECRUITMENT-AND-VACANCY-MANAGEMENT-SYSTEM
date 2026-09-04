<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Supplementary name fields for job seeker profiles. The existing `name`
            // column is left untouched since UserResource, the navbar, and staff
            // creation all still key off it.
            $table->string('first_name')->nullable()->after('name');
            $table->string('middle_name')->nullable()->after('first_name');
            $table->string('last_name')->nullable()->after('middle_name');

            // Job seeker profile detail.
            $table->decimal('cgpa', 3, 2)->nullable()->after('address');
            $table->string('graduation_university')->nullable()->after('cgpa');
            $table->string('worked_company')->nullable()->after('graduation_university');

            // Manager accounts are now assigned to a specific department by admin.
            $table->foreignId('department_id')->nullable()->after('worked_company')->constrained()->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['department_id']);
            $table->dropColumn([
                'first_name', 'middle_name', 'last_name',
                'cgpa', 'graduation_university', 'worked_company', 'department_id',
            ]);
        });
    }
};
