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
        Schema::create('roles_usuario', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('usuarios')->cascadeOnUpdate()->cascadeOnDelete();
            $table->enum('rol', ['decano', 'director', 'centro_facultativo', 'centro_estudiantes', 'docente', 'estudiante']);
            $table->foreignId('carrera_id')->nullable()->constrained('carreras')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('facultad_id')->nullable()->constrained('facultades')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles_usuario');
    }
};
