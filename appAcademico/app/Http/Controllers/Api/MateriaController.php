<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Materia;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class MateriaController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Materia::with('carrera');
            
            // Filtrar por carrera si se proporciona
            if ($request->has('carrera_id') && $request->carrera_id && is_numeric($request->carrera_id)) {
                $query->where('carrera_id', (int) $request->carrera_id);
            }
            
            return response()->json($query->get(), 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            // Verificar si el usuario actual es director (no decano)
            $usuarioActual = $request->user();
            $habilidades = $usuarioActual?->currentAccessToken()?->abilities ?? [];
            $rolActivo = collect($habilidades)->first(fn (string $habilidad) => $habilidad !== '*');
            $esDecano = $rolActivo === 'decano';
            $esDirector = $rolActivo === 'director';
            
            // Si es director, forzar su carrera_id
            if ($esDirector) {
                $contextoCarrera = $this->getCarreraContext($usuarioActual);
                $request->merge([
                    'carrera_id' => $contextoCarrera['carrera_id'],
                ]);
            }
            
            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:255'],
                'carrera_id' => ['required', 'integer', 'exists:carreras,id'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            
            // Si es director, verificar que no intente crear en otra carrera
            if ($esDirector) {
                $contextoCarrera = $this->getCarreraContext($usuarioActual);
                if (! $contextoCarrera['carrera_id'] || (int) $data['carrera_id'] !== (int) $contextoCarrera['carrera_id']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No puedes crear materias en otra carrera.',
                    ], 403);
                }
            }

            $materia = Materia::create($data);

            return response()->json($materia->load('carrera'), 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $materia = Materia::with(['carrera', 'horarios'])->find($id);

            if (! $materia) {
                return response()->json([
                    'message' => 'Materia no encontrada.',
                ], 404);
            }

            return response()->json($materia, 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $materia = Materia::find($id);

            if (! $materia) {
                return response()->json([
                    'message' => 'Materia no encontrada.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:255'],
                'carrera_id' => ['required', 'integer', 'exists:carreras,id'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $materia->update($validator->validated());

            return response()->json($materia->load('carrera'), 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $materia = Materia::find($id);

            if (! $materia) {
                return response()->json([
                    'message' => 'Materia no encontrada.',
                ], 404);
            }

            $materia->delete();

            return response()->json([
                'message' => 'Materia eliminada correctamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    private function getCarreraContext(?Usuario $usuario): array
    {
        if (! $usuario) {
            return ['carrera_id' => null, 'facultad_id' => null];
        }

        $usuario->loadMissing('rolesUsuario');
        $rolConCarrera = $usuario->rolesUsuario
            ->first(fn ($rolUsuario) => $rolUsuario->rol === 'director' && $rolUsuario->carrera_id)
            ?? $usuario->rolesUsuario->first(fn ($rolUsuario) => $rolUsuario->carrera_id);

        return [
            'carrera_id' => $usuario->carrera_id ?? $rolConCarrera?->carrera_id,
            'facultad_id' => $usuario->facultad_id ?? $rolConCarrera?->facultad_id,
        ];
    }
}
