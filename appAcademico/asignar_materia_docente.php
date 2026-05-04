<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\MateriaPeriodo;
use Illuminate\Support\Facades\DB;

// Asignar al docente ID 5 (jj) la materia ID 2 en el periodo activo ID 2 (2026-1)
$docenteId = 5;
$materiaId = 2;
$periodoId = 2; // 2026-1 activo

// Verificar si ya existe
$existente = MateriaPeriodo::where('docente_id', $docenteId)
    ->where('materia_id', $materiaId)
    ->where('periodo_id', $periodoId)
    ->first();

if ($existente) {
    echo "Ya existe asignación: ID {$existente->id}\n";
} else {
    $asignacion = MateriaPeriodo::create([
        'periodo_id' => $periodoId,
        'materia_id' => $materiaId,
        'docente_id' => $docenteId,
        'paralelo' => 'A',
        'estado' => 'activa',
    ]);
    echo "Asignación creada: ID {$asignacion->id}\n";
    echo "Materia: {$materiaId}, Docente: {$docenteId}, Periodo: {$periodoId}\n";
}

echo "\n=== Verificación final ===\n";
$count = MateriaPeriodo::where('docente_id', $docenteId)
    ->whereHas('periodo', fn($q) => $q->where('activo', true))
    ->count();
echo "Materias en periodo activo para docente {$docenteId}: {$count}\n";
