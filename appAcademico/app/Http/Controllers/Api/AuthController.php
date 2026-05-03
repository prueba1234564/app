<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Sanctum\PersonalAccessToken;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        Log::info('Login attempt', ['data' => $request->all()]);

        $credenciales = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (! Auth::attempt($credenciales)) {
            return response()->json([
                'message' => 'Credenciales incorrectas'
            ], 401);
        }

        /** @var Usuario $usuario */
        $usuario = Usuario::with(['rolesUsuario.carrera', 'rolesUsuario.facultad', 'carrera', 'facultad'])
            ->where('email', $credenciales['email'])
            ->firstOrFail();
        $roles = $usuario->rolesUsuario->pluck('rol')->unique()->values();

        $usuario->tokens()->delete();

        if ($roles->count() === 1) {
            $rol = $roles->first();
            $token = $usuario->createToken('auth_token', [$rol])->plainTextToken;

            return response()->json([
                'token' => $token,
                'usuario' => $this->formatearUsuario($usuario),
                'roles' => $roles,
                'rol_activo' => $rol,
            ]);
        }

        $token = $usuario->createToken('auth_token_seleccion', [])->plainTextToken;

        return response()->json([
            'token' => $token,
            'usuario' => $this->formatearUsuario($usuario),
            'roles' => $roles,
            'requiere_seleccion_rol' => true,
        ]);
    }

    public function seleccionarRol(Request $request)
    {
        $data = $request->validate([
            'rol' => ['required', 'string'],
        ]);

        $bearerToken = $request->bearerToken();
        $accessToken = $bearerToken ? PersonalAccessToken::findToken($bearerToken) : null;

        if (! $accessToken) {
            return response()->json([
                'message' => 'Debes autenticarte antes de seleccionar un rol.',
            ], 401);
        }

        /** @var Usuario $usuario */
        $usuario = $accessToken->tokenable->loadMissing(['rolesUsuario.carrera', 'rolesUsuario.facultad', 'carrera', 'facultad']);
        $roles = $usuario->rolesUsuario()->pluck('rol');

        if (! $roles->contains($data['rol'])) {
            return response()->json([
                'message' => 'El rol seleccionado no pertenece al usuario autenticado.',
            ], 403);
        }

        $accessToken->delete();

        $token = $usuario->createToken('auth_token', [$data['rol']])->plainTextToken;

        return response()->json([
            'token' => $token,
            'usuario' => $this->formatearUsuario($usuario),
            'rol_activo' => $data['rol'],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Sesion cerrada correctamente.',
        ]);
    }

    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        /** @var Usuario $usuario */
        $usuario = $request->user();

        // Verificar contraseña actual usando Hash::check (compatible con Sanctum)
        if (! \Illuminate\Support\Facades\Hash::check($data['current_password'], $usuario->password)) {
            return response()->json([
                'message' => 'La contraseña actual es incorrecta.',
            ], 422);
        }

        // Actualizar contraseña
        $usuario->password = bcrypt($data['new_password']);
        $usuario->save();

        return response()->json([
            'success' => true,
            'message' => 'Contraseña actualizada correctamente.',
        ]);
    }

    public function me(Request $request)
    {
        /** @var Usuario $usuario */
        $usuario = $request->user()->load(['rolesUsuario.carrera', 'rolesUsuario.facultad', 'carrera', 'facultad']);
        $habilidades = $usuario->currentAccessToken()?->abilities ?? [];
        $rolActivo = collect($habilidades)->first(fn (string $habilidad) => $habilidad !== '*');

        return response()->json([
            'usuario' => $this->formatearUsuario($usuario),
            'roles' => $usuario->rolesUsuario->pluck('rol')->unique()->values(),
            'rol_activo' => $rolActivo,
        ]);
    }

    private function formatearUsuario(Usuario $usuario): array
    {
        $usuario->loadMissing(['rolesUsuario.carrera', 'rolesUsuario.facultad', 'carrera', 'facultad']);

        $rolConCarrera = $usuario->rolesUsuario
            ->first(fn ($rolUsuario) => $rolUsuario->carrera_id);
        $carrera = $usuario->carrera ?? $rolConCarrera?->carrera;
        $facultad = $usuario->facultad ?? $rolConCarrera?->facultad ?? $carrera?->facultad;

        return [
            'id' => $usuario->id,
            'nombre' => $usuario->nombre,
            'email' => $usuario->email,
            'carrera_id' => $usuario->carrera_id ?? $rolConCarrera?->carrera_id,
            'facultad_id' => $usuario->facultad_id ?? $rolConCarrera?->facultad_id ?? $carrera?->facultad_id,
            'carrera' => $carrera ? [
                'id' => $carrera->id,
                'nombre' => $carrera->nombre,
                'codigo' => $carrera->codigo,
                'facultad_id' => $carrera->facultad_id,
            ] : null,
            'facultad' => $facultad ? [
                'id' => $facultad->id,
                'nombre' => $facultad->nombre,
            ] : null,
        ];
    }
}
