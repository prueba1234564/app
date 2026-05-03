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
        Schema::create('notificaciones', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('cuerpo');
            $table->string('ruta_archivo')->nullable();
            $table->foreignId('enviado_por')->constrained('usuarios')->cascadeOnUpdate()->restrictOnDelete();
            $table->enum('rol_destino', ['todos', 'docentes', 'estudiantes']);
            $table->foreignId('carrera_id')->nullable()->constrained('carreras')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('facultad_id')->nullable()->constrained('facultades')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('actividad_id')->nullable()->constrained('actividades')->cascadeOnUpdate()->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notificaciones');
    }
};
