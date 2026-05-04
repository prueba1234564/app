<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Actividad;
use App\Models\Notificacion;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Throwable;

class ActividadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Actividad::with(['creador', 'materia', 'carrera']);
            
            // Filtros
            if ($request->has('categoria') && $request->categoria) {
                $query->where('categoria', $request->categoria);
            }
            
            if ($request->has('carrera_id') && $request->carrera_id) {
                $query->where('carrera_id', $request->carrera_id);
            }
            
            if ($request->has('rol_destino') && $request->rol_destino) {
                $query->where('rol_destino', $request->rol_destino);
            }
            
            // Ordenar por fecha de entrega (las más próximas primero)
            $query->orderBy('fecha_entrega', 'asc');
            
            return response()->json([
                'success' => true,
                'data' => $query->get(),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'titulo' => ['required', 'string', 'max:255'],
                'descripcion' => ['nullable', 'string'],
                'categoria' => ['required', 'in:parcial,tarea,proyecto,evento,comunicado'],
                'fecha_entrega' => ['nullable', 'date'],
                'archivo' => ['nullable', 'file', 'max:10240'], // 10MB max
                'materia_id' => ['nullable', 'integer', 'exists:materias,id'],
                'carrera_id' => ['nullable', 'integer', 'exists:carreras,id'],
                'rol_destino' => ['required', 'in:todos,docentes,estudiantes'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $usuarioActual = $request->user();
            $data = $validator->validated();
            
            // Procesar archivo si existe
            $rutaArchivo = null;
            if ($request->hasFile('archivo')) {
                $rutaArchivo = $request->file('archivo')->store('actividades', 'public');
            }

            $actividad = Actividad::create([
                'titulo' => $data['titulo'],
                'descripcion' => $data['descripcion'] ?? null,
                'categoria' => $data['categoria'],
                'fecha_entrega' => $data['fecha_entrega'] ?? null,
                'ruta_archivo' => $rutaArchivo,
                'creado_por' => $usuarioActual->id,
                'materia_id' => $data['materia_id'] ?? null,
                'carrera_id' => $data['carrera_id'] ?? null,
                'rol_destino' => $data['rol_destino'],
            ]);

            // Crear notificación automática
            $this->crearNotificacionActividad($actividad, $usuarioActual);

            return response()->json([
                'success' => true,
                'message' => 'Actividad creada correctamente.',
                'data' => $actividad->load(['creador', 'carrera']),
            ], 201);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $actividad = Actividad::with(['creador', 'materia', 'carrera'])->find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada.',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $actividad,
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $actividad = Actividad::find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada.',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'titulo' => ['sometimes', 'string', 'max:255'],
                'descripcion' => ['nullable', 'string'],
                'categoria' => ['sometimes', 'in:parcial,tarea,proyecto,evento,comunicado'],
                'fecha_entrega' => ['nullable', 'date'],
                'archivo' => ['nullable', 'file', 'max:10240'],
                'materia_id' => ['nullable', 'integer', 'exists:materias,id'],
                'carrera_id' => ['nullable', 'integer', 'exists:carreras,id'],
                'rol_destino' => ['sometimes', 'in:todos,docentes,estudiantes'],
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Error de validacion.',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            
            // Procesar archivo si existe
            if ($request->hasFile('archivo')) {
                // Eliminar archivo anterior si existe
                if ($actividad->ruta_archivo) {
                    Storage::disk('public')->delete($actividad->ruta_archivo);
                }
                $data['ruta_archivo'] = $request->file('archivo')->store('actividades', 'public');
            }

            $actividad->update($data);

            return response()->json([
                'success' => true,
                'message' => 'Actividad actualizada correctamente.',
                'data' => $actividad->load(['creador', 'carrera']),
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $actividad = Actividad::find($id);
            
            if (!$actividad) {
                return response()->json([
                    'success' => false,
                    'message' => 'Actividad no encontrada.',
                ], 404);
            }

            // Eliminar archivo si existe
            if ($actividad->ruta_archivo) {
                Storage::disk('public')->delete($actividad->ruta_archivo);
            }

            $actividad->delete();

            return response()->json([
                'success' => true,
                'message' => 'Actividad eliminada correctamente.',
            ], 200);
        } catch (Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error del servidor.',
            ], 500);
        }
    }

    /**
     * Crear notificación automática cuando se crea una actividad.
     * Respeta el rol_destino de la actividad:
     *   - 'todos'       → notifica a todos
     *   - 'docentes'    → notifica a docentes y director
     *   - 'estudiantes' → notifica solo a estudiantes
     */
    private function crearNotificacionActividad(Actividad $actividad, $usuario): void
    {
        try {
            $carreraInfo = $actividad->carrera ? " - {$actividad->carrera->nombre}" : '';
            $fechaInfo = $actividad->fecha_entrega
                ? " | Fecha: " . $actividad->fecha_entrega->format('d/m/Y')
                : '';

            $rolDestino = match ($actividad->rol_destino) {
                'todos'       => 'todos',
                'docentes'    => 'docentes',
                'estudiantes' => 'estudiantes',
                default       => 'todos',
            };

            // Cuando incluye docentes, también llega al director
            $rolDestinoArray = match ($rolDestino) {
                'docentes' => ['docentes', 'director'],
                'todos'    => ['todos'],
                default    => null,
            };

            Notificacion::create([
                'titulo'            => $actividad->titulo,
                'cuerpo'            => $actividad->descripcion ?? "Nueva actividad: {$actividad->titulo}{$carreraInfo}{$fechaInfo}",
                'enviado_por'       => $usuario->id,
                'rol_destino'       => $rolDestino,
                'rol_destino_array' => $rolDestinoArray,
                'carrera_id'        => $actividad->carrera_id,
                'actividad_id'      => $actividad->id,
            ]);
        } catch (Throwable $e) {
            \Log::error('Error creando notificación de actividad: ' . $e->getMessage());
        }
    }
}
