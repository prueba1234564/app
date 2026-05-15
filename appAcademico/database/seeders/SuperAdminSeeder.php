<?php

namespace Database\Seeders;

use App\Models\RolUsuario;
use App\Models\Usuario;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $usuario = Usuario::withTrashed()->updateOrCreate(
            ['email' => 'admin@academico.com'],
            [
                'nombre' => 'Super Admin',
                'password' => Hash::make('admin123'),
                'esta_verificado' => true,
                'facultad_id' => null,
                'carrera_id' => null,
                'matricula_pdf' => null,
                'deleted_at' => null,
            ]
        );

        RolUsuario::updateOrCreate(
            [
                'usuario_id' => $usuario->id,
                'rol' => 'decano',
            ],
            [
                'carrera_id' => null,
                'facultad_id' => null,
            ]
        );

    }
}
