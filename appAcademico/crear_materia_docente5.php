<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use App\Models\MateriaPeriodo;

$periodoId = 2; // 2026-1 activo
$docenteId = 5; // jj
$carreraId = 3; // Comunicación Social (tiene estudiantes)

// 1. Crear nueva materia
$materia = Materia::create([
    'nombre' => 'Comunicación Digital',
    'carrera_id' => $carreraId,
]);
echo "Materia creada: ID {$materia->id}, Nombre: {$materia->nombre}\n";

// 2. Crear oferta en periodo activo asignada al docente 5
$oferta = MateriaPeriodo::create([
    'periodo_id' => $periodoId,
    'materia_id' => $materia->id,
    'docente_id' => $docenteId,
    'paralelo' => 'B',
    'estado' => 'activa',
]);
echo "Oferta creada: ID {$oferta->id}\n";

echo "\n=== Verificación: Materias del docente jj (ID {$docenteId}) en periodo activo ===\n";
$materiasDocente = DB::table('materia_periodo')
    ->join('materias', 'materia_periodo.materia_id', '=', 'materias.id')
    ->join('carreras', 'materias.carrera_id', '=', 'carreras.id')
    ->where('materia_periodo.docente_id', $docenteId)
    ->where('materia_periodo.periodo_id', $periodoId)
    ->select('materias.id', 'materias.nombre', 'carreras.nombre as carrera_nombre', 'carreras.id as carrera_id')
    ->get();

foreach ($materiasDocente as $m) {
    echo "- {$m->nombre} (Carrera: {$m->carrera_nombre}, ID: {$m->carrera_id})\n";
}
echo "Total: " . $materiasDocente->count() . "\n";
