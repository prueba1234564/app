<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Buscar un docente que tenga ofertas en periodo activo
$docenteId = DB::table('materia_periodo')
    ->join('periodos', 'materia_periodo.periodo_id', '=', 'periodos.id')
    ->where('periodos.activo', true)
    ->whereNotNull('materia_periodo.docente_id')
    ->select('materia_periodo.docente_id')
    ->first();

if (!$docenteId) {
    echo "No hay docentes con materias en periodo activo." . PHP_EOL;
    exit;
}

$docenteId = $docenteId->docente_id;
echo "Docente ID: {$docenteId}" . PHP_EOL;

// Obtener mis materias (simulación)
use App\Models\Materia;
$materias = Materia::with('carrera')
    ->withCount(['estudiantes', 'actividades'])
    ->whereHas('ofertas', function($query) use ($docenteId) {
        $query->where('docente_id', $docenteId)
              ->whereHas('periodo', fn($q) => $q->where('activo', true));
    })
    ->orderBy('nombre')
    ->get();

echo "Materias encontradas: " . $materias->count() . PHP_EOL;
foreach ($materias as $m) {
    echo "  - {$m->nombre}" . PHP_EOL;
    // Conteo manual
    $conteo = DB::table('estudiante_materia')
        ->where('materia_id', $m->id)
        ->count();
    echo "    estudiantes_count en response: {$m->estudiantes_count}" . PHP_EOL;
    echo "    Conteo manual pivot: {$conteo}" . PHP_EOL;
}
