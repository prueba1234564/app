<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('materia_periodo', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periodo_id')->constrained('periodos')->onDelete('cascade');
            $table->foreignId('materia_id')->constrained('materias')->onDelete('cascade');
            $table->foreignId('docente_id')->nullable()->constrained('usuarios')->onDelete('set null');
            $table->enum('estado', ['activa', 'cancelada', 'finalizada'])->default('activa');
            $table->text('observaciones')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique(['periodo_id', 'materia_id']);
            $table->index(['periodo_id', 'estado']);
            $table->index(['docente_id', 'periodo_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('materia_periodo');
    }
};
