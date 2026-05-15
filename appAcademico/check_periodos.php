<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Periodo;

echo "=== Periodos ===\n";
$periodos = DB::table('periodos')->orderBy('id')->get();
foreach ($periodos as $p) {
    echo "ID: {$p->id}, Nombre: {$p->nombre}, Activo: " . ($p->activo ? 'SI' : 'NO') . ", Fechas: {$p->fecha_inicio} - {$p->fecha_fin}\n";
}

echo "\n=== MateriasPeriodo con docente ===\n";
$ofertas = DB::table('materia_periodo')
    ->join('periodos', 'materia_periodo.periodo_id', '=', 'periodos.id')
    ->whereNotNull('materia_periodo.docente_id')
    ->select('materia_periodo.*', 'periodos.nombre as periodo_nombre', 'periodos.activo')
    ->orderBy('materia_periodo.id')
    ->get();

foreach ($ofertas as $o) {
    echo "ID: {$o->id}, Materia: {$o->materia_id}, Docente: {$o->docente_id}, Periodo: {$o->periodo_nombre} (activo: " . ($o->activo ? 'SI' : 'NO') . ")\n";
}
