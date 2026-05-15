<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use Illuminate\Support\Facades\DB;

$materiaId = 2; // tttt

$materia = Materia::with('carrera')
    ->withCount(['actividades'])
    ->withCount(['estudiantes as estudiantes_count' => function($query) {
        $query->select(DB::raw('COUNT(DISTINCT usuario_id)'));
    }])
    ->find($materiaId);

echo "Materia: {$materia->nombre}" . PHP_EOL;
echo "estudiantes_count (con subconsulta DISTINCT): {$materia->estudiantes_count}" . PHP_EOL;

// Conteo manual
$conteo = DB::table('estudiante_materia')
    ->where('materia_id', $materiaId)
    ->distinct('usuario_id')
    ->count('usuario_id');
echo "Conteo manual DISTINCT: {$conteo}" . PHP_EOL;

// Conteo sin distinct
$conteoNormal = DB::table('estudiante_materia')
    ->where('materia_id', $materiaId)
    ->count();
echo "Conteo normal: {$conteoNormal}" . PHP_EOL;
