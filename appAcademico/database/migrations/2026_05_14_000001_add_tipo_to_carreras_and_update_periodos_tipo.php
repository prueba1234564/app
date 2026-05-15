<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migración: Soporte para carreras semestrales y anuales
 * -------------------------------------------------------
 * 1. Agrega la columna `tipo` a la tabla `carreras`
 *    Valores: 'semestral' | 'anual'  (por defecto: 'semestral')
 *
 * 2. Amplía el enum `tipo` de la tabla `periodos`
 *    Agrega el valor 'anual' a los existentes 'semestre' | 'temporada'
 */
return new class extends Migration
{
    // -------------------------------------------------------------------------
    // UP
    // -------------------------------------------------------------------------
    public function up(): void
    {
        // 1. Columna tipo en carreras
        Schema::table('carreras', function (Blueprint $table) {
            $table->enum('tipo', ['semestral', 'anual'])
                  ->default('semestral')
                  ->after('facultad_id')
                  ->comment('Define si la carrera trabaja con períodos semestrales o anuales');
        });

        // 2. Ampliar enum tipo en periodos (SQLite no soporta ALTER COLUMN,
        //    por lo que usamos una estrategia compatible con PostgreSQL y SQLite)
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            // PostgreSQL: ALTER TYPE directamente
            DB::statement("ALTER TABLE periodos DROP CONSTRAINT IF EXISTS periodos_tipo_check");
            DB::statement("ALTER TABLE periodos ADD CONSTRAINT periodos_tipo_check
                           CHECK (tipo IN ('semestre', 'temporada', 'anual'))");
        }
        // SQLite no tiene enums reales, los almacena como TEXT → ya acepta 'anual' sin cambios
        // MySQL requeriría MODIFY COLUMN, pero el proyecto usa pgsql/sqlite
    }

    // -------------------------------------------------------------------------
    // DOWN
    // -------------------------------------------------------------------------
    public function down(): void
    {
        // Revertir columna tipo en carreras
        Schema::table('carreras', function (Blueprint $table) {
            $table->dropColumn('tipo');
        });

        // Revertir enum en periodos (solo PostgreSQL)
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE periodos DROP CONSTRAINT IF EXISTS periodos_tipo_check");
            DB::statement("ALTER TABLE periodos ADD CONSTRAINT periodos_tipo_check
                           CHECK (tipo IN ('semestre', 'temporada'))");
        }
    }
};
