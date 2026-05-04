<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$materiaId = 1; // Cambiar por una materia específica

echo "=== Consulta estudiantes por materia ID: $materiaId ===" . PHP_EOL;

// Simular la consulta del controlador
$estudiantes = DB::table('estudiante_materia')
    ->join('usuarios', 'estudiante_materia.usuario_id', '=', 'usuarios.id')
    ->where('estudiante_materia.materia_id', $materiaId)
    ->groupBy('estudiante_materia.usuario_id', 'usuarios.id', 'usuarios.nombre', 'usuarios.email')
    ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email')
    ->orderBy('usuarios.nombre')
    ->get();

echo "Total: " . count($estudiantes) . PHP_EOL;
foreach ($estudiantes as $e) {
    echo "  - {$e->nombre} (ID: {$e->id})" . PHP_EOL;
}

echo PHP_EOL . "=== Registros en estudiante_materia para esta materia ===" . PHP_EOL;
$registros = DB::table('estudiante_materia')
    ->where('materia_id', $materiaId)
    ->orderBy('usuario_id')
    ->get();
foreach ($registros as $r) {
    echo "  usuario_id: {$r->usuario_id}, id: {$r->id}" . PHP_EOL;
}
