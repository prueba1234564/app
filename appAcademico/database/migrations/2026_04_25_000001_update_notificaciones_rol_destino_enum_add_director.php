<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // PostgreSQL: Laravel enum() creates a CHECK constraint.
        DB::statement("ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_rol_destino_check");
        DB::statement("ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_rol_destino_check CHECK (rol_destino IN ('todos','director','centro_facultativo','centro_estudiantes','docentes','estudiantes'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_rol_destino_check");
        DB::statement("ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_rol_destino_check CHECK (rol_destino IN ('todos','docentes','estudiantes'))");
    }
};
