<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('interviews', function (Blueprint $table) {
            $table->decimal('result', 5, 2)->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('interviews', fn (Blueprint $table) => $table->dropColumn('result'));
    }
};
