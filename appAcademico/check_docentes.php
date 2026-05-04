<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use App\Models\Usuario;
use App\Models\MateriaPeriodo;
use Illuminate\Support\Facades\DB;

echo "=== Todos los docentes ===\n";
$docentes = Usuario::whereHas('rolesUsuario', fn($q) => $q->where('rol', 'docente'))->get();
foreach ($docentes as $d) {
    echo "ID: {$d->id}, Nombre: {$d->nombre}, Email: {$d->email}\n";
    
    // Materias en periodo activo
    $count = MateriaPeriodo::where('docente_id', $d->id)
        ->whereHas('periodo', fn($q) => $q->where('activo', true))
        ->count();
    echo "  Materias en periodo activo: {$count}\n";
    
    // Todas las materias (cualquier periodo)
    $total = MateriaPeriodo::where('docente_id', $d->id)->count();
    echo "  Total materias asignadas (todos periodos): {$total}\n\n";
}
