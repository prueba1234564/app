<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$carreraId = 1;

$est = DB::table('usuarios')
    ->join('roles_usuario', 'usuarios.id', '=', 'roles_usuario.usuario_id')
    ->where('usuarios.carrera_id', $carreraId)
    ->where('roles_usuario.rol', 'estudiante')
    ->count();

echo "Estudiantes en carrera ID {$carreraId}: {$est}\n";

// Listar estudiantes
$estudiantes = DB::table('usuarios')
    ->join('roles_usuario', 'usuarios.id', '=', 'roles_usuario.usuario_id')
    ->where('usuarios.carrera_id', $carreraId)
    ->where('roles_usuario.rol', 'estudiante')
    ->select('usuarios.id', 'usuarios.nombre', 'usuarios.email')
    ->get();

echo "Lista:\n";
foreach ($estudiantes as $e) {
    echo "  - {$e->nombre} ({$e->email})\n";
}
