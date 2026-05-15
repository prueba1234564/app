<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Rellena materia_periodo_id en horarios existentes que lo tienen NULL.
 * Busca la oferta activa (o más reciente) para cada materia_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Obtener todos los horarios sin materia_periodo_id
        $horariosSinPeriodo = DB::table('horarios')
            ->whereNull('materia_periodo_id')
            ->get();

        foreach ($horariosSinPeriodo as $horario) {
            // Buscar la oferta más reciente para esta materia
            $oferta = DB::table('materia_periodo')
                ->where('materia_id', $horario->materia_id)
                ->whereNull('deleted_at')
                ->orderByDesc('id')
                ->first();

            if ($oferta) {
                DB::table('horarios')
                    ->where('id', $horario->id)
                    ->update(['materia_periodo_id' => $oferta->id]);
            }
        }
    }

    public function down(): void
    {
        // No revertir — dejar los datos como están
    }
};
