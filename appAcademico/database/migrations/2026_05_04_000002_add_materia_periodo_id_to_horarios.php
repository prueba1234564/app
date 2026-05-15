<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            // Agregar relacion con materia_periodo (nullable para no romper registros existentes)
            $table->foreignId('materia_periodo_id')
                ->nullable()
                ->after('materia_id')
                ->constrained('materia_periodo')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('horarios', function (Blueprint $table) {
            $table->dropForeign(['materia_periodo_id']);
            $table->dropColumn('materia_periodo_id');
        });
    }
};
