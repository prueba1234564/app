<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use App\Models\MateriaPeriodo;
use Illuminate\Support\Facades\DB;

$periodoId = 2; // 2026-1 activo

echo "=== Materias totales ===\n";
$todas = Materia::orderBy('id')->get();
foreach ($todas as $m) {
    echo "ID: {$m->id}, Nombre: {$m->nombre}, Carrera: {$m->carrera_id}\n";
}

echo "\n=== Ofertas en periodo {$periodoId} ===\n";
$ofertas = MateriaPeriodo::where('periodo_id', $periodoId)->with('materia', 'docente')->get();
foreach ($ofertas as $o) {
    echo "Materia: {$o->materia->nombre} (ID: {$o->materia_id}), Docente: " . ($o->docente->nombre ?? 'ninguno') . " (ID: {$o->docente_id}), Estado: {$o->estado}\n";
}

echo "\n=== Materias SIN docente en periodo activo ===\n";
$sinDocente = MateriaPeriodo::where('periodo_id', $periodoId)
    ->whereNull('docente_id')
    ->with('materia')
    ->get();
foreach ($sinDocente as $s) {
    echo "Materia: {$s->materia->nombre} (ID: {$s->materia_id}), Paralelo: {$s->paralelo}\n";
}
echo "Total: " . $sinDocente->count() . "\n";
