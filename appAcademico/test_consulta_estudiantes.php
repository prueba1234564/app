<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use Illuminate\Support\Facades\DB;

// Buscar una materia con estudiantes
$materia = Materia::with('estudiantes')->has('estudiantes')->first();

if (!$materia) {
    echo "No hay materias con estudiantes." . PHP_EOL;
    exit;
}

echo "=== Materia: {$materia->nombre} (ID: {$materia->id}) ===" . PHP_EOL;

// Conteo con withCount estándar
$conteo = $materia->estudiantes()->count();
echo "Conteo directo (sin distinct): {$conteo}" . PHP_EOL;

// Usando el enfoque del controlador
$ids = DB::table('estudiante_materia')
    ->where('materia_id', $materia->id)
    ->groupBy('usuario_id')
    ->select('usuario_id')
    ->get();
echo "Conteo por grupo usuario_id: " . count($ids) . PHP_EOL;

// Listar estudiantes
$estudiantes = $materia->estudiantes()->get();
echo "Lista de estudiantes (" . count($estudiantes) . "):" . PHP_EOL;
foreach ($estudiantes as $e) {
    echo "  - {$e->nombre} (ID: {$e->id})" . PHP_EOL;
}

echo PHP_EOL . "=== Probando consulta del controlador (con groupBy) ===" . PHP_EOL;
$result = DB::table('estudiante_materia')
    ->join('usuarios', 'estudiante_materia.usuario_id', '=', 'usuarios.id')
    ->where('estudiante_materia.materia_id', $materia->id)
    ->groupBy('estudiante_materia.usuario_id', 'usuarios.id', 'usuarios.nombre', 'usuarios.email')
    ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email')
    ->orderBy('usuarios.nombre')
    ->get();
echo "Resultados: " . count($result) . PHP_EOL;
foreach ($result as $r) {
    echo "  - {$r->nombre} (ID: {$r->id})" . PHP_EOL;
}
