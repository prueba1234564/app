<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Materias con estudiantes ===" . PHP_EOL;
$materiasConEstudiantes = DB::table('estudiante_materia')
    ->join('materias', 'estudiante_materia.materia_id', '=', 'materias.id')
    ->groupBy('estudiante_materia.materia_id', 'materias.nombre')
    ->select('estudiante_materia.materia_id', 'materias.nombre', DB::raw('COUNT(*) as total'))
    ->orderBy('total', 'desc')
    ->get();

foreach ($materiasConEstudiantes as $m) {
    echo "Materia ID: {$m->materia_id}, Nombre: {$m->nombre}, Total registros: {$m->total}" . PHP_EOL;
    
    // Ver duplicados en esta materia
    $dup = DB::table('estudiante_materia')
        ->where('materia_id', $m->materia_id)
        ->groupBy('usuario_id')
        ->havingRaw('COUNT(*) > 1')
        ->select('usuario_id', DB::raw('COUNT(*) as cant'))
        ->get();
    
    if ($dup->count() > 0) {
        echo "  ⚠️ DUPLICADOS encontrados:" . PHP_EOL;
        foreach ($dup as $d) {
            echo "    Usuario ID: {$d->usuario_id} aparece {$d->cant} veces" . PHP_EOL;
        }
    }
}

echo PHP_EOL . "=== Verificando unique constraint ===" . PHP_EOL;
$indexes = DB::select("SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'estudiante_materia' AND indexname LIKE '%unique%'");
echo "Unique constraints: " . count($indexes) . PHP_EOL;
foreach ($indexes as $idx) {
    echo "  - {$idx->indexname}" . PHP_EOL;
}
