<?php

namespace Database\Seeders;

use App\Models\Facultad;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FacultadesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $facultad = Facultad::firstOrCreate(
            ['nombre' => 'Facultad de Ciencias Sociales'],
            ['nombre' => 'Facultad de Ciencias Sociales']
        );

        // Ahora crear las carreras con esta facultad
        $carreras = [
            ['nombre' => 'Sociología', 'facultad_id' => $facultad->id],
            ['nombre' => 'Trabajo Social', 'facultad_id' => $facultad->id],
            ['nombre' => 'Comunicación Social', 'facultad_id' => $facultad->id],
            ['nombre' => 'Antropología', 'facultad_id' => $facultad->id],
            ['nombre' => 'Arqueología', 'facultad_id' => $facultad->id],
        ];

        foreach ($carreras as $carrera) {
            \App\Models\Carrera::firstOrCreate(
                ['nombre' => $carrera['nombre']],
                $carrera
            );
        }
    }
}
