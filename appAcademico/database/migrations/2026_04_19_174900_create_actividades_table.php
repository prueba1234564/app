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
        Schema::create('actividades', function (Blueprint $table) {
            $table->id();
            $table->string('titulo');
            $table->text('descripcion')->nullable();
            $table->enum('categoria', ['parcial', 'tarea', 'proyecto', 'evento', 'comunicado']);
            $table->timestamp('fecha_entrega')->nullable();
            $table->string('ruta_archivo')->nullable();
            $table->foreignId('creado_por')->constrained('usuarios')->cascadeOnUpdate()->restrictOnDelete();
            $table->foreignId('materia_id')->nullable()->constrained('materias')->cascadeOnUpdate()->nullOnDelete();
            $table->foreignId('carrera_id')->nullable()->constrained('carreras')->cascadeOnUpdate()->nullOnDelete();
            $table->enum('rol_destino', ['todos', 'docentes', 'estudiantes']);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividades');
    }
};
