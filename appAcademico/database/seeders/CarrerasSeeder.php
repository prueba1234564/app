<?php

namespace Database\Seeders;

use App\Models\Carrera;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CarrerasSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $carreras = [
            ['nombre' => 'Sociología'],
            ['nombre' => 'Trabajo Social'],
            ['nombre' => 'Comunicación Social'],
            ['nombre' => 'Antropología'],
            ['nombre' => 'Arqueología'],
        ];

        foreach ($carreras as $carrera) {
            Carrera::firstOrCreate(
                ['nombre' => $carrera['nombre']],
                $carrera
            );
        }
    }
}
