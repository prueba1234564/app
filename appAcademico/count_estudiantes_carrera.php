<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make('Illuminate\Contracts\Console\Kernel');
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$carreraId = 1;

$est = DB::table('usuarios')
    ->join('rol_usuario', 'usuarios.id', '=', 'rol_usuario.usuario_id')
    ->where('usuarios.carrera_id', $carreraId)
    ->where('rol_usuario.rol', 'estudiante')
    ->count();

echo "Estudiantes en carrera ID {$carreraId}: {$est}\n";
