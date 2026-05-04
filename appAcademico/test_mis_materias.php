<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use Illuminate\Support\Facades\DB;

// Buscar un docente
$docente = DB::table('usuarios')->where('rol', 'docente')->first();
if (!$docente) {
    echo "No hay docentes." . PHP_EOL;
    exit;
}
echo "Docente: {$docente->nombre} (ID: {$docente->id})" . PHP_EOL;

// Obtener materias asignadas (simulando misMaterias)
$materias = Materia::with('carrera')
    ->withCount(['estudiantes', 'actividades'])
    ->whereHas('ofertas', function($query) use ($docente) {
        $query->where('docente_id', $docente->id)
              ->whereHas('periodo', fn($q) => $q->where('activo', true));
    })
    ->orderBy('nombre')
    ->get();

echo "Materias asignadas: " . $materias->count() . PHP_EOL;
foreach ($materias as $m) {
    echo "  - {$m->nombre} (ID: {$m->id})" . PHP_EOL;
    echo "    estudiantes_count: {$m->estudiantes_count}" . PHP_EOL;
    
    // Verificar conteo manual
    $conteoManual = DB::table('estudiante_materia')
        ->where('materia_id', $m->id)
        ->count();
    echo "    Conteo manual (registros en pivot): {$conteoManual}" . PHP_EOL;
}
