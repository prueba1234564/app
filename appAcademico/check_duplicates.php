<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$duplicados = DB::table('estudiante_materia')
    ->select('materia_id', 'usuario_id', DB::raw('COUNT(*) as cant'))
    ->groupBy('materia_id', 'usuario_id')
    ->havingRaw('COUNT(*) > 1')
    ->get();

echo "Duplicados restantes: " . count($duplicados) . PHP_EOL;

foreach ($duplicados as $d) {
    echo "Materia {$d->materia_id}, Estudiante {$d->usuario_id}: {$d->cant} registros" . PHP_EOL;
    
    $ids = DB::table('estudiante_materia')
        ->where('materia_id', $d->materia_id)
        ->where('usuario_id', $d->usuario_id)
        ->orderBy('id')
        ->pluck('id');
    echo "  IDs: " . implode(', ', $ids->toArray()) . PHP_EOL;
}
