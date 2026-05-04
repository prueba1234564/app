<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Eliminar duplicados manteniendo el registro más antiguo por (materia_id, usuario_id)
        $duplicados = DB::table('estudiante_materia')
            ->select('materia_id', 'usuario_id', DB::raw('MIN(id) as id_min'))
            ->groupBy('materia_id', 'usuario_id')
            ->havingRaw('COUNT(*) > 1')
            ->get();

        foreach ($duplicados as $dup) {
            $ids = DB::table('estudiante_materia')
                ->where('materia_id', $dup->materia_id)
                ->where('usuario_id', $dup->usuario_id)
                ->where('id', '!=', $dup->id_min)
                ->pluck('id')
                ->toArray();

            if (!empty($ids)) {
                DB::table('estudiante_materia')->whereIn('id', $ids)->delete();
            }
        }

        // Agregar constraint única para prevenir futuros duplicados
        Schema::table('estudiante_materia', function (Blueprint $table) {
            $table->unique(['materia_id', 'usuario_id']);
        });
    }

    public function down(): void
    {
        Schema::table('estudiante_materia', function (Blueprint $table) {
            $table->dropUnique(['estudiante_materia_materia_id_usuario_id_unique']);
        });
    }
};
