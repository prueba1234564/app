<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

// Verificar misMaterias para docente ID 5
$docenteId = 5;
$periodoId = 2;

$materias = DB::table('materia_periodo')
    ->join('materias', 'materia_periodo.materia_id', '=', 'materias.id')
    ->join('carreras', 'materias.carrera_id', '=', 'carreras.id')
    ->where('materia_periodo.docente_id', $docenteId)
    ->where('materia_periodo.periodo_id', $periodoId)
    ->select('materias.id', 'materias.nombre', 'materias.carrera_id', 'carreras.nombre as carrera_nombre',
             DB::raw('(SELECT COUNT(*) FROM estudiante_materia WHERE materia_id = materias.id) as estudiantes_count'))
    ->get();

echo "=== Mis Materias (docente ID {$docenteId}, periodo {$periodoId}) ===\n";
foreach ($materias as $m) {
    echo "Materia: {$m->nombre} (ID: {$m->id}), Carrera: {$m->carrera_nombre} (ID: {$m->carrera_id}), Estudiantes: {$m->estudiantes_count}\n";
}
echo "Total: " . $materias->count() . "\n\n";

// Verificar estudiantes por carrera
echo "=== Estudiantes por carrera ===\n";
$carreras = $materias->pluck('carrera_id')->unique();
foreach ($carreras as $cid) {
    $est = DB::table('usuarios')
        ->where('carrera_id', $cid)
        ->whereHas('rolesUsuario', fn($q) => $q->where('rol', 'estudiante'))
        ->count();
    echo "Carrera ID {$cid}: {$est} estudiantes\n";
}
