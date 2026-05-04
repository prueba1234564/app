<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\Api\DocenteController;

// Simular request del usuario docente ID 5
$request = Request::create('/api/docente/materias', 'GET', [], [], [], [
    'HTTP_Authorization' => 'Bearer token-placeholder',
]);

// Obtener el usuario
$usuario = DB::table('usuarios')->where('id', 5)->first();
if (!$usuario) {
    echo "Usuario no encontrado\n";
    exit;
}

echo "Usuario: {$usuario->nombre} (ID: {$usuario->id})\n";

// Probar la consulta manualmente
use App\Models\Materia;
use Illuminate\Support\Facades\DB;

$docenteId = 5;

try {
    $materias = Materia::with('carrera')
        ->withCount(['estudiantes', 'actividades'])
        ->whereHas('ofertas', function($query) use ($docenteId) {
            $query->where('docente_id', $docenteId)
                  ->whereHas('periodo', fn($q) => $q->where('activo', true));
        })
        ->orderBy('nombre')
        ->get();

    echo "Éxito: " . $materias->count() . " materias\n";
    foreach ($materias as $m) {
        echo "- {$m->nombre} (carrera: " . ($m->carrera->nombre ?? 'null') . ")\n";
    }
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Trace:\n" . $e->getTraceAsString() . "\n";
}
