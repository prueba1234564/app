<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('actividad_completada', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')
                  ->constrained('usuarios')
                  ->cascadeOnDelete();
            $table->foreignId('actividad_id')
                  ->constrained('actividades')
                  ->cascadeOnDelete();
            $table->timestamp('completada_en')->useCurrent();
            $table->timestamps();

            $table->unique(['usuario_id', 'actividad_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('actividad_completada');
    }
};
