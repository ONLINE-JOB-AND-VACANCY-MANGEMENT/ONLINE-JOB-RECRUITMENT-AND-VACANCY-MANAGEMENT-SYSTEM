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
Schema::create('exams', function (Blueprint $table) {
    $table->id();
    $table->foreignId('application_id')->constrained()->onDelete('cascade');
    $table->dateTime('scheduled_at');
    $table->string('location')->nullable();
    $table->enum('mode', ['onsite', 'online'])->default('onsite');
    $table->enum('status', ['scheduled', 'completed', 'cancelled'])->default('scheduled');
    $table->decimal('score', 5, 2)->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exams');
    }
};
