<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use Illuminate\Support\Facades\DB;

$docenteId = 5;

// Simular misMaterias
$materias = Materia::with('carrera')
    ->withCount(['estudiantes', 'actividades'])
    ->whereHas('ofertas', function($query) use ($docenteId) {
        $query->where('docente_id', $docenteId)
              ->whereHas('periodo', fn($q) => $q->where('activo', true));
    })
    ->orderBy('nombre')
    ->get();

echo "=== misMaterias para docente ID {$docenteId} ===\n";
echo "Total: " . $materias->count() . "\n";
foreach ($materias as $m) {
    echo "- {$m->nombre} (carrera: {$m->carrera->nombre}, estudiantes_count: {$m->estudiantes_count})\n";
}

echo "\n=== Payload de Notificación (materiaId='todas') ===\n";
$carreraIds = $materias->pluck('carrera_id')->filter()->unique()->values()->all();
echo "carrera_ids: " . json_encode($carreraIds) . "\n";
echo "rol_destino: estudiantes\n";

echo "\n=== Estudiantes en esas carreras ===\n";
$ids = DB::table('usuarios')
    ->join('roles_usuario', 'usuarios.id', '=', 'roles_usuario.usuario_id')
    ->whereIn('usuarios.carrera_id', $carreraIds)
    ->where('roles_usuario.rol', 'estudiante')
    ->select('usuarios.id', 'usuarios.nombre', 'usuarios.carrera_id')
    ->distinct()
    ->get();
echo "Total estudiantes únicos: " . $ids->count() . "\n";
foreach ($ids as $e) {
    echo "  - {$e->nombre} (carrera {$e->carrera_id})\n";
}
