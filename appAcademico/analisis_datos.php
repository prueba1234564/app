<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Estudiantes por carrera ===\n";
$estXsCarrera = DB::table('usuarios')
    ->join('roles_usuario', 'usuarios.id', '=', 'roles_usuario.usuario_id')
    ->where('roles_usuario.rol', 'estudiante')
    ->select('usuarios.carrera_id', DB::raw('COUNT(*) as total'))
    ->groupBy('usuarios.carrera_id')
    ->orderBy('total', 'desc')
    ->get();

foreach ($estXsCarrera as $row) {
    $carrera = DB::table('carreras')->where('id', $row->carrera_id)->first();
    $nombreCarrera = $carrera ? $carrera->nombre : 'Desconocida';
    echo "Carrera ID {$row->carrera_id} ({$nombreCarrera}): {$row->total} estudiantes\n";
}

echo "\n=== Materias disponibles por carrera ===\n";
$materias = DB::table('materias')
    ->join('carreras', 'materias.carrera_id', '=', 'carreras.id')
    ->select('materias.id', 'materias.nombre', 'materias.carrera_id', 'carreras.nombre as carrera_nombre')
    ->orderBy('materias.carrera_id')
    ->get();

foreach ($materias as $m) {
    echo "Materia ID {$m->id}: {$m->nombre} (Carrera: {$m->carrera_nombre})\n";
}

echo "\n=== Ofertas periodo activo (2) ===\n";
$ofertas = DB::table('materia_periodo')
    ->where('periodo_id', 2)
    ->get();
foreach ($ofertas as $o) {
    $mat = DB::table('materias')->where('id', $o->materia_id)->first();
    echo "Materia: {$mat->nombre} (ID: {$o->materia_id}), Docente: {$o->docente_id}\n";
}
