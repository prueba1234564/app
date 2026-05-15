<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\MateriaPeriodo;
use Illuminate\Support\Facades\DB;

$docenteId = 5; // jj
$materiaId = 1; // uuu
$periodoId = 2; // 2026-1 activo

// Crear oferta para materia 1 en periodo 2
try {
    $asignacion = MateriaPeriodo::create([
        'periodo_id' => $periodoId,
        'materia_id' => $materiaId,
        'docente_id' => $docenteId,
        'paralelo' => 'A',
        'estado' => 'activa',
    ]);
    echo "Oferta creada: ID {$asignacion->id}\n";
    echo "Materia: {$materiaId}, Docente: {$docenteId}, Periodo: {$periodoId}\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

echo "\n=== Verificación: Materias del docente jj en periodo activo ===\n";
$materias = DB::table('materia_periodo')
    ->join('materias', 'materia_periodo.materia_id', '=', 'materias.id')
    ->where('materia_periodo.docente_id', $docenteId)
    ->where('materia_periodo.periodo_id', $periodoId)
    ->select('materia_periodo.*', 'materias.nombre as materia_nombre')
    ->get();

foreach ($materias as $m) {
    echo "Oferta ID: {$m->id}, Materia: {$m->materia_nombre} (ID: {$m->materia_id}), Carrera: {$m->docente_id}\n";
}
echo "Total: " . $materias->count() . "\n";
