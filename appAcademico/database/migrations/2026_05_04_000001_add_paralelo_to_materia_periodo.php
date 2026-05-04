<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('materia_periodo', function (Blueprint $table) {
            $table->string('paralelo', 10)->nullable()->after('docente_id'); // A, B, C, 1, 2...
        });
    }

    public function down(): void
    {
        Schema::table('materia_periodo', function (Blueprint $table) {
            $table->dropColumn('paralelo');
        });
    }
};
