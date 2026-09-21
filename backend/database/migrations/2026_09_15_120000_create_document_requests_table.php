<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('document_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->unique()->constrained()->cascadeOnDelete();
            $table->json('required_documents');
            $table->json('submitted_documents')->nullable();
            $table->dateTime('deadline');
            $table->dateTime('supplied_at')->nullable();
            $table->dateTime('proven_at')->nullable();
            $table->timestamps();
            $table->index(['deadline', 'proven_at']);
        });

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('applied','shortlisted','exam_scheduled','interview_scheduled','documentation_requested','documentation_supplied','documentation_proven','hired','rejected') NOT NULL DEFAULT 'applied'");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('document_requests');
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY status ENUM('applied','shortlisted','exam_scheduled','interview_scheduled','hired','rejected') NOT NULL DEFAULT 'applied'");
        }
    }
};
