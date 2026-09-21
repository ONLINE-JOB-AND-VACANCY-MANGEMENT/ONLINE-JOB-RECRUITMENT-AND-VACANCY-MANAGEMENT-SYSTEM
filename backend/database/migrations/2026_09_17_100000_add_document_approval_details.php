<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            $table->string('location')->nullable()->after('deadline');
            $table->text('announcement')->nullable()->after('location');
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('applied','shortlisted','exam_scheduled','interview_scheduled','reserved','documentation_requested','documentation_supplied','documentation_proven','hired','rejected') NOT NULL DEFAULT 'applied'");
        }
    }

    public function down(): void
    {
        Schema::table('document_requests', function (Blueprint $table) {
            $table->dropColumn(['location', 'announcement']);
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('applied','shortlisted','exam_scheduled','interview_scheduled','documentation_requested','documentation_supplied','documentation_proven','hired','rejected') NOT NULL DEFAULT 'applied'");
        }
    }
};
