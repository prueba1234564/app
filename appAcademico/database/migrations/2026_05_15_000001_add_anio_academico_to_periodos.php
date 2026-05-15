<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega soporte para dos niveles de período:
 *
 *  1. Año académico  (nivel decano)
 *     tipo = 'anio_academico', anio_academico_id = NULL, carrera_id = NULL
 *
 *  2. Período de carrera (nivel director)
 *     tipo = 'semestre' | 'anual' | 'temporada'
 *     anio_academico_id = FK al año académico padre
 *     carrera_id        = FK a la carrera del director
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periodos', function (Blueprint $table) {
            // FK al año académico padre (null = es un año académico)
            $table->unsignedBigInteger('anio_academico_id')
                  ->nullable()
                  ->after('activo')
                  ->comment('NULL = es un año académico; valor = período hijo de ese año');

            // Carrera a la que pertenece este período (solo para períodos de director)
            $table->unsignedBigInteger('carrera_id')
                  ->nullable()
                  ->after('anio_academico_id')
                  ->comment('NULL = aplica a toda la institución (año académico)');

            $table->foreign('anio_academico_id')
                  ->references('id')
                  ->on('periodos')
                  ->nullOnDelete();

            $table->foreign('carrera_id')
                  ->references('id')
                  ->on('carreras')
                  ->cascadeOnDelete();
        });

        // Ampliar el enum tipo para incluir 'anio_academico' y 'anual'
        // PostgreSQL no soporta ALTER COLUMN en enums, usamos CHECK constraint
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE periodos DROP CONSTRAINT IF EXISTS periodos_tipo_check");
            DB::statement("ALTER TABLE periodos ADD CONSTRAINT periodos_tipo_check
                           CHECK (tipo IN ('semestre', 'anual', 'temporada', 'anio_academico'))");
        }
    }

    public function down(): void
    {
        Schema::table('periodos', function (Blueprint $table) {
            $table->dropForeign(['anio_academico_id']);
            $table->dropForeign(['carrera_id']);
            $table->dropColumn(['anio_academico_id', 'carrera_id']);
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE periodos DROP CONSTRAINT IF EXISTS periodos_tipo_check");
            DB::statement("ALTER TABLE periodos ADD CONSTRAINT periodos_tipo_check
                           CHECK (tipo IN ('semestre', 'anual', 'temporada'))");
        }
    }
};
