<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Materia;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;

// Buscar un docente
$docente = Usuario::whereHas('rolesUsuario', fn($q) => $q->where('rol', 'docente'))->first();
if (!$docente) {
    echo "No hay docentes.\n";
    exit;
}
echo "Docente: {$docente->nombre} (ID: {$docente->id})\n";

// Obtener sus materias en periodo activo (como en misMaterias)
$materias = Materia::with('carrera')
    ->whereHas('ofertas', function($query) use ($docente) {
        $query->where('docente_id', $docente->id)
              ->whereHas('periodo', fn($q) => $q->where('activo', true));
    })
    ->orderBy('nombre')
    ->get();

echo "Materias asignadas: " . $materias->count() . "\n";
foreach ($materias as $m) {
    echo "  - {$m->nombre} (carrera_id: {$m->carrera_id})\n";
}

// Simular el payload que envía el frontend
$carreraIds = $materias->pluck('carrera_id')->filter()->unique()->values()->all();
echo "\nCarrera IDs que se enviarían: " . json_encode($carreraIds) . "\n";

// Verificar si hay estudiantes en esas carreras
echo "\nEstudiantes por carrera:\n";
foreach ($carreraIds as $cid) {
    $count = DB::table('usuarios')
        ->where('carrera_id', $cid)
        ->whereHas('rolesUsuario', fn($q) => $q->where('rol', 'estudiante'))
        ->count();
    echo "  Carrera ID {$cid}: {$count} estudiantes\n";
}
