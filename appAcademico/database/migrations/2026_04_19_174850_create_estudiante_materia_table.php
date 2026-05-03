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
        Schema::create('estudiante_materia', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnUpdate()->cascadeOnDelete();
            $table->foreignId('materia_id')->constrained('materias')->cascadeOnUpdate()->cascadeOnDelete();
            $table->timestamp('fecha_inscripcion');
            $table->timestamps();
            $table->unique(['usuario_id', 'materia_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estudiante_materia');
    }
};
