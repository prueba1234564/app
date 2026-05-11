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

        // Bloquear estudiantes no verificados
        $esEstudiante = $roles->contains('estudiante') && $roles->count() === 1;
        if ($esEstudiante && ! $usuario->esta_verificado) {
            return response()->json([
                'message' => 'Tu cuenta aún no ha sido verificada. Asegúrate de que tu RU aparezca en el PDF de matrícula que subiste, o contacta a tu director de carrera.',
                'no_verificado' => true,
            ], 403);
        }

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

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $usuario = Usuario::where('email', $request->email)->first();

        // Siempre responder igual para no revelar si el email existe
        if (!$usuario) {
            return response()->json([
                'success' => true,
                'message' => 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
            ]);
        }

        // Generar token temporal (6 dígitos)
        $codigo = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expira = now()->addMinutes(15);

        \Illuminate\Support\Facades\Cache::put(
            'reset_password_' . $usuario->id,
            ['codigo' => $codigo, 'expira' => $expira],
            $expira
        );

        Log::info("Código de recuperación para {$usuario->email}: {$codigo}");

        return response()->json([
            'success' => true,
            'message' => 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña.',
            // En desarrollo devolvemos el código directamente
            'dev_codigo' => app()->environment('local') ? $codigo : null,
            'usuario_id' => app()->environment('local') ? $usuario->id : null,
        ]);
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'usuario_id' => 'required|integer',
            'codigo'     => 'required|string|size:6',
            'password'   => 'required|string|min:6|confirmed',
        ]);

        $cached = \Illuminate\Support\Facades\Cache::get('reset_password_' . $data['usuario_id']);

        if (!$cached || $cached['codigo'] !== $data['codigo'] || now()->isAfter($cached['expira'])) {
            return response()->json([
                'success' => false,
                'message' => 'Código inválido o expirado.',
            ], 422);
        }

        $usuario = Usuario::find($data['usuario_id']);
        if (!$usuario) {
            return response()->json(['success' => false, 'message' => 'Usuario no encontrado.'], 404);
        }

        $usuario->password = \Illuminate\Support\Facades\Hash::make($data['password']);
        $usuario->save();

        \Illuminate\Support\Facades\Cache::forget('reset_password_' . $data['usuario_id']);

        return response()->json([
            'success' => true,
            'message' => 'Contraseña restablecida correctamente.',
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
