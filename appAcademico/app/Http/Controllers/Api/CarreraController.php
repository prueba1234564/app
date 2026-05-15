<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Carrera;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Throwable;

class CarreraController extends Controller
{
    private function getCodigoCarrera(string $nombre): string
    {
        $palabras = explode(' ', $nombre);
        $codigo = '';
        foreach ($palabras as $palabra) {
            if (strlen($palabra) > 2) {
                $codigo .= strtoupper(substr($palabra, 0, 1));
            }
        }
        return $codigo ?: 'CAR';
    }

    public function index(): JsonResponse
    {
        try {
            $carreras = Carrera::with([
                'facultad',
                'materias',
                'usuarios.rolesUsuario',
            ])->get();
            
            $carrerasEnriquecidas = $carreras->map(function ($carrera) {

                // Contar solo usuarios con rol 'estudiante'
                $totalEstudiantes = $carrera->usuarios
                    ->filter(fn ($u) => $u->rolesUsuario->contains('rol', 'estudiante'))
                    ->count();

                // Buscar el director real de la carrera
                $directorUsuario = $carrera->usuarios
                    ->first(fn ($u) => $u->rolesUsuario->contains('rol', 'director'));

                $directorNombre = $directorUsuario?->nombre ?? 'Por asignar';

                return [
                    'id'               => $carrera->id,
                    'nombre'           => $carrera->nombre,
                    'codigo'           => $this->getCodigoCarrera($carrera->nombre),
                    'facultad'         => $carrera->facultad,
                    'facultad_id'      => $carrera->facultad_id,
                    'tipo'             => $carrera->tipo,
                    'secciones'        => $carrera->secciones,
                    'director'         => $directorNombre,
                    'total_estudiantes'=> $totalEstudiantes,
                    'total_materias'   => $carrera->materias->count(),
                    'created_at'       => $carrera->created_at,
                    'updated_at'       => $carrera->updated_at,
                ];
            });

            return response()->json($carrerasEnriquecidas, 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:255'],
                'facultad_id' => ['required', 'integer', 'exists:facultades,id'],
                'tipo' => ['required', 'string', 'in:anual,semestral'],
                'secciones' => ['required', 'integer', 'min:1', 'max:12'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $carrera = Carrera::create($validator->validated());

            return response()->json($carrera->load('facultad'), 201);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $carrera = Carrera::with(['facultad', 'materias'])->find($id);

            if (! $carrera) {
                return response()->json([
                    'message' => 'Carrera no encontrada.',
                ], 404);
            }

            return response()->json($carrera, 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $carrera = Carrera::find($id);

            if (! $carrera) {
                return response()->json([
                    'message' => 'Carrera no encontrada.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'nombre' => ['required', 'string', 'max:255'],
                'facultad_id' => ['required', 'integer', 'exists:facultades,id'],
                'tipo' => ['required', 'string', 'in:anual,semestral'],
                'secciones' => ['required', 'integer', 'min:1', 'max:12'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $carrera->update($validator->validated());

            return response()->json($carrera->load('facultad'), 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $carrera = Carrera::find($id);

            if (! $carrera) {
                return response()->json([
                    'message' => 'Carrera no encontrada.',
                ], 404);
            }

            $carrera->delete();

            return response()->json([
                'message' => 'Carrera eliminada correctamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Error del servidor.',
            ], 500);
        }
    }
}
