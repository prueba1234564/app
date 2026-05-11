<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notificacion;
use App\Models\NotificacionLeida;
use App\Models\Usuario;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NotificacionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $habilidades = $usuario?->currentAccessToken()?->abilities ?? [];
        $rolActivo = collect($habilidades)->first(fn (string $habilidad) => $habilidad !== '*');
        $carreraId = $this->getCarreraId($usuario);

        $query = Notificacion::query()
            ->select('id', 'titulo', 'cuerpo', 'rol_destino', 'rol_destino_array', 'ruta_archivo', 'enviado_por', 'carrera_id', 'carrera_ids', 'facultad_id', 'actividad_id', 'created_at', 'updated_at')
            ->with(['emisor:id,nombre,email', 'carrera:id,nombre', 'actividad:id,titulo,categoria,fecha_entrega,ruta_archivo'])
            ->with(['notificacionesLeidas' => fn ($q) => $q->where('usuario_id', $usuario->id)->select('id', 'notificacion_id', 'usuario_id', 'leido_en')])
            ->latest();

        if ($rolActivo !== 'decano') {
            if ($rolActivo === 'estudiante') {
                $query->whereIn('rol_destino', ['todos', 'estudiantes']);
            } elseif ($rolActivo === 'director') {
                $query->whereIn('rol_destino', ['todos', 'director', 'docentes']);
            } elseif ($rolActivo === 'centro_facultativo') {
                $query->whereIn('rol_destino', ['todos', 'centro_facultativo', 'estudiantes']);
            } elseif ($rolActivo === 'centro_estudiantes') {
                $query->whereIn('rol_destino', ['todos', 'centro_estudiantes', 'estudiantes']);
            } else {
                $query->whereIn('rol_destino', ['todos', 'docentes']);
            }

            // Nunca mostrar en recibidas las notificaciones que el propio usuario envió
            $query->where('enviado_por', '!=', $usuario->id);

            // Filter by career: show general notifications (no career filter) OR
            // notifications matching user's specific career (single or multiple)
            $query->where(function ($q) use ($carreraId) {
                $q->where(function ($q2) {
                    $q2->whereNull('carrera_id')->whereNull('carrera_ids');
                })
                ->orWhere('carrera_id', $carreraId)
                ->orWhereJsonContains('carrera_ids', $carreraId);
            });
        }

        // Para decano: filtrar notificaciones en el index
        if ($rolActivo === 'decano') {
            // Si se especifica un rol de emisor, filtrar por ese rol
            if ($request->has('rol_emisor') && $request->rol_emisor && $request->rol_emisor !== 'todos') {
                $query->whereHas('emisor.rolesUsuario', function ($q) use ($request) {
                    $q->where('rol', $request->rol_emisor);
                });
            } else {
                // Si no, excluir notificaciones propias (ver solo lo que enviaron otros)
                $query->where('enviado_por', '!=', $usuario->id);
            }
            
            // Filtros por fecha (solo para decano)
            if ($request->has('fecha_desde') && $request->fecha_desde) {
                $query->whereDate('created_at', '>=', $request->fecha_desde);
            }
            if ($request->has('fecha_hasta') && $request->fecha_hasta) {
                $query->whereDate('created_at', '<=', $request->fecha_hasta);
            }
        }
        
        $perPage = min((int) ($request->query('per_page', 20)), 50);
        $paginated = $query->paginate($perPage);
        $paginated->getCollection()->transform(fn ($n) => $this->appendReadState(collect([$n]))->first());

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function recibidas(Request $request): JsonResponse
    {
        return $this->index($request);
    }

    public function enviadas(Request $request): JsonResponse
    {
        $query = Notificacion::query()
            ->select('id', 'titulo', 'cuerpo', 'rol_destino', 'rol_destino_array', 'ruta_archivo', 'enviado_por', 'carrera_id', 'carrera_ids', 'facultad_id', 'actividad_id', 'created_at', 'updated_at')
            ->with(['emisor:id,nombre,email', 'carrera:id,nombre', 'actividad:id,titulo,categoria,fecha_entrega,ruta_archivo'])
            ->with(['notificacionesLeidas' => fn ($q) => $q->where('usuario_id', $request->user()->id)->select('id', 'notificacion_id', 'usuario_id', 'leido_en')])
            ->where('enviado_por', $request->user()->id)
            ->latest();

        if ($request->filled('fecha_desde')) {
            $query->whereDate('created_at', '>=', $request->fecha_desde);
        }

        if ($request->filled('fecha_hasta')) {
            $query->whereDate('created_at', '<=', $request->fecha_hasta);
        }

        $perPage = min((int) ($request->query('per_page', 20)), 50);
        $paginated = $query->paginate($perPage);
        $paginated->getCollection()->transform(fn ($n) => $this->appendReadState(collect([$n]))->first());

        return response()->json([
            'success' => true,
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'per_page'     => $paginated->perPage(),
                'total'        => $paginated->total(),
            ],
        ]);
    }

    public function marcarComoLeida(Request $request, int $id): JsonResponse
    {
        $notificacion = Notificacion::find($id);

        if (! $notificacion) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404, [], JSON_UNESCAPED_UNICODE);
        }

        $leida = NotificacionLeida::firstOrCreate(
            [
                'notificacion_id' => $notificacion->id,
                'usuario_id' => $request->user()->id,
            ],
            [
                'leido_en' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Notificación marcada como leída.',
            'data' => [
                'notificacion_id' => $notificacion->id,
                'leida' => true,
                'leido_en' => $leida->leido_en,
            ],
        ], 200, [], JSON_UNESCAPED_UNICODE);
    }

    public function store(Request $request): JsonResponse
    {

        
        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'cuerpo' => ['required', 'string'],
            'rol_destino' => ['required', 'in:todos,director,centro_facultativo,centro_estudiantes,docentes,estudiantes'],
            'rol_destino_array' => ['nullable', 'array'],
            'rol_destino_array.*' => ['in:todos,director,centro_facultativo,centro_estudiantes,docentes,estudiantes'],
            'carrera_id' => ['nullable', 'integer'],
            'carrera_ids' => ['nullable', 'array'],
            'carrera_ids.*' => ['integer'],
            'facultad_id' => ['nullable', 'integer'],
            'actividad_id' => ['nullable', 'integer'],
            'ruta_archivo' => ['nullable', 'string', 'max:255'],
        ]);

        // Validate file separately to avoid web FormData issues
        if ($request->hasFile('archivo')) {
            $request->validate([
                'archivo' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
            ]);
        }

        $usuario = $request->user();
        $habilidades = $usuario?->currentAccessToken()?->abilities ?? [];
        $rolActivo = collect($habilidades)->first(fn (string $habilidad) => $habilidad !== '*');

        if ($rolActivo === 'docente') {
            $data['rol_destino'] = 'estudiantes';
            $data['rol_destino_array'] = null;
        }

        if ($rolActivo === 'director') {
            $data['carrera_id'] = null;
            $data['carrera_ids'] = array_filter([$this->getCarreraId($usuario)]);
        }

        $data['enviado_por'] = $usuario->id;

        // Ensure carrera_ids is always set (null if not provided)
        if (!isset($data['carrera_ids'])) {
            $data['carrera_ids'] = null;
        } elseif (empty($data['carrera_ids'])) {
            $data['carrera_ids'] = null;
        }
        
        
        // Ensure rol_destino_array is always set (null if not provided or empty)
        if (!isset($data['rol_destino_array'])) {
            $data['rol_destino_array'] = null;
        } elseif (empty($data['rol_destino_array'])) {
            $data['rol_destino_array'] = null;
        }
        
        if ($request->hasFile('archivo')) {
            $file = $request->file('archivo');
            $path = $file->storePublicly('notificaciones', 'public');
            $data['ruta_archivo'] = asset('storage/' . $path);
        }

        try {
            $notificacion = Notificacion::create($data);

            return response()->json([
                'success' => true,
                'message' => 'Notificación creada correctamente.',
                'data' => $notificacion,
            ], 201, [], JSON_UNESCAPED_UNICODE);
        } catch (\Exception $e) {
            \Log::error('Error al crear notificación: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error al crear notificación: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $notificacion = Notificacion::find($id);

        if (! $notificacion) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        if ($this->isDirector($request) && (int) $notificacion->enviado_por !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para editar esta notificacion.',
            ], 403);
        }

        $data = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'cuerpo' => ['required', 'string'],
            'rol_destino' => ['required', 'in:todos,director,centro_facultativo,centro_estudiantes,docentes,estudiantes'],
            'rol_destino_array' => ['nullable', 'array'],
            'rol_destino_array.*' => ['in:todos,director,centro_facultativo,centro_estudiantes,docentes,estudiantes'],
            'carrera_id' => ['nullable', 'integer'],
            'carrera_ids' => ['nullable', 'array'],
            'carrera_ids.*' => ['integer'],
            'facultad_id' => ['nullable', 'integer'],
            'actividad_id' => ['nullable', 'integer'],
        ]);

        // Ensure rol_destino_array is null if empty
        if (!isset($data['rol_destino_array']) || empty($data['rol_destino_array'])) {
            $data['rol_destino_array'] = null;
        }

        if ($this->isDirector($request)) {
            $data['carrera_id'] = null;
            $data['carrera_ids'] = array_filter([$this->getCarreraId($request->user())]);
        }

        // Handle file upload during update
        if ($request->hasFile('archivo')) {
            $request->validate([
                'archivo' => ['file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,webp'],
            ]);
            
            $file = $request->file('archivo');
            \Log::info('Archivo recibido en update:', [
                'name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'mime' => $file->getMimeType(),
            ]);
            
            // Delete old file if exists
            if ($notificacion->ruta_archivo) {
                $oldPath = str_replace(asset('storage/'), '', $notificacion->ruta_archivo);
                \Storage::disk('public')->delete($oldPath);
                \Log::info('Archivo anterior eliminado:', ['path' => $oldPath]);
            }
            
            $path = $file->storePublicly('notificaciones', 'public');
            $data['ruta_archivo'] = asset('storage/' . $path);
            \Log::info('Nuevo archivo guardado en update:', ['path' => $path, 'url' => $data['ruta_archivo']]);
        } elseif ($request->input('eliminar_archivo') === 'true') {
            // Eliminar archivo si se solicita
            if ($notificacion->ruta_archivo) {
                $oldPath = str_replace(asset('storage/'), '', $notificacion->ruta_archivo);
                \Storage::disk('public')->delete($oldPath);
                \Log::info('Archivo eliminado por solicitud:', ['path' => $oldPath]);
            }
            $data['ruta_archivo'] = null;
        }

        $notificacion->update($data);

        return response()->json([
            'success' => true,
            'message' => 'Notificación actualizada correctamente.',
            'data' => $notificacion,
        ], 200);
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        $notificacion = Notificacion::find($id);

        if (! $notificacion) {
            return response()->json([
                'success' => false,
                'message' => 'Notificación no encontrada.',
            ], 404);
        }

        if ($this->isDirector($request) && (int) $notificacion->enviado_por !== (int) $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'No tienes permiso para eliminar esta notificacion.',
            ], 403);
        }

        $notificacion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notificación eliminada correctamente.',
        ], 200);
    }

    private function getCarreraId(?Usuario $usuario): ?int
    {
        if (! $usuario) {
            return null;
        }

        $usuario->loadMissing('rolesUsuario');
        $rolConCarrera = $usuario->rolesUsuario
            ->first(fn ($rolUsuario) => $rolUsuario->rol === 'director' && $rolUsuario->carrera_id)
            ?? $usuario->rolesUsuario->first(fn ($rolUsuario) => $rolUsuario->carrera_id);

        return $usuario->carrera_id ?? $rolConCarrera?->carrera_id;
    }

    private function isDirector(Request $request): bool
    {
        $habilidades = $request->user()?->currentAccessToken()?->abilities ?? [];

        return collect($habilidades)->contains('director');
    }

    private function appendReadState($notificaciones)
    {
        return $notificaciones->map(function (Notificacion $notificacion) {
            $lectura = $notificacion->notificacionesLeidas->first();

            $notificacion->setAttribute('leida', (bool) $lectura);
            $notificacion->setAttribute('leido_en', $lectura?->leido_en);
            $notificacion->unsetRelation('notificacionesLeidas');

            return $notificacion;
        });
    }
}
