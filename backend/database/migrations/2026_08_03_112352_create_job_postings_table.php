<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('job_postings', function (Blueprint $table) {
    $table->id();
    $table->foreignId('company_id')->constrained()->onDelete('cascade');
    $table->foreignId('category_id')->constrained()->onDelete('cascade');
    $table->string('title');
    $table->text('description');
    $table->text('requirements')->nullable();
    $table->decimal('salary_min', 10, 2)->nullable();
    $table->decimal('salary_max', 10, 2)->nullable();
    $table->string('location')->nullable();
    $table->enum('job_type', ['full_time', 'part_time', 'contract', 'internship', 'remote'])->default('full_time');
    $table->enum('experience_level', ['entry', 'mid', 'senior', 'executive'])->default('entry');
    $table->enum('status', ['open', 'closed', 'draft'])->default('open');
    $table->date('start_date')->nullable();
$table->date('end_date')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_postings');
    }
};
