<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega el tipo 'anual' al enum de periodos.
 *
 * Antes:  tipo ENUM('semestre', 'temporada')
 * Después: tipo ENUM('semestre', 'anual', 'temporada')
 *
 * Nota: PostgreSQL no soporta ALTER COLUMN en enums directamente,
 * por eso se usa una estrategia compatible con ambos motores.
 */
return new class extends Migration
{
    public function up(): void
    {
        // PostgreSQL: agregar el nuevo valor al tipo enum existente
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TYPE periodos_tipo_enum ADD VALUE IF NOT EXISTS 'anual'");
            return;
        }

        // MySQL / SQLite: modificar la columna directamente
        Schema::table('periodos', function (Blueprint $table) {
            $table->enum('tipo', ['semestre', 'anual', 'temporada'])
                  ->default('semestre')
                  ->change();
        });
    }

    public function down(): void
    {
        // No se puede eliminar un valor de un enum en PostgreSQL sin recrear el tipo.
        // En MySQL/SQLite se revierte al estado anterior.
        if (DB::getDriverName() === 'pgsql') {
            return;
        }

        Schema::table('periodos', function (Blueprint $table) {
            $table->enum('tipo', ['semestre', 'temporada'])
                  ->default('semestre')
                  ->change();
        });
    }
};
