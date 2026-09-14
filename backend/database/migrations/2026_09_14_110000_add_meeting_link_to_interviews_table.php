<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->string('meeting_link')->nullable()->after('mode');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->dropColumn('meeting_link');
        });
    }
};
