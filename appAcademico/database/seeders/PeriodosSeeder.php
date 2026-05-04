<?php

namespace Database\Seeders;

use App\Models\Periodo;
use Illuminate\Database\Seeder;

class PeriodosSeeder extends Seeder
{
    public function run(): void
    {
        $year = (int) now()->format('Y');

        $periodos = [
            [
                'nombre' => $year . '-1',
                'tipo' => 'semestre',
                'fecha_inicio' => $year . '-02-01',
                'fecha_fin' => $year . '-06-30',
            ],
            [
                'nombre' => $year . '-2',
                'tipo' => 'semestre',
                'fecha_inicio' => $year . '-07-01',
                'fecha_fin' => $year . '-11-30',
            ],
            [
                'nombre' => 'Verano ' . $year,
                'tipo' => 'temporada',
                'fecha_inicio' => $year . '-12-01',
                'fecha_fin' => ($year + 1) . '-01-31',
            ],
        ];

        foreach ($periodos as $p) {
            Periodo::firstOrCreate(
                ['nombre' => $p['nombre']],
                [
                    'tipo' => $p['tipo'],
                    'fecha_inicio' => $p['fecha_inicio'],
                    'fecha_fin' => $p['fecha_fin'],
                    'activo' => false,
                ]
            );
        }

        $hoy = now()->toDateString();
        $vigente = Periodo::query()
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->whereDate('fecha_fin', '>=', $hoy)
            ->orderByDesc('fecha_inicio')
            ->first();

        if ($vigente) {
            Periodo::query()->update(['activo' => false]);
            $vigente->update(['activo' => true]);
        }
    }
}
