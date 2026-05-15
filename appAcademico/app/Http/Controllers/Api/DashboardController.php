<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Usuario;
use App\Models\Carrera;
use App\Models\Materia;
use App\Models\Facultad;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalUsuarios = Usuario::count();
        $totalCarreras = Carrera::count();
        $totalMaterias = Materia::count();
        $totalFacultades = Facultad::count();
        
        // Usuarios nuevos este mes
        $usuariosNuevos = Usuario::whereMonth('created_at', now()->month)->count();
        
        // Actividad mensual (porcentaje simulado basado en usuarios activos)
        $actividadMensual = min(95, round(($usuariosNuevos / max($totalUsuarios, 1)) * 100 + 85));

        // Carreras activas con detalles reales (últimas 3)
        $carrerasActivas = Carrera::with(['facultad', 'materias'])
            ->withCount(['usuarios as total_estudiantes'])
            ->latest()
            ->take(3)
            ->get()
            ->map(function ($carrera) {
                return [
                    'id' => $carrera->id,
                    'nombre' => $carrera->nombre,
                    'facultad' => $carrera->facultad?->nombre ?? 'Sin Facultad',
                    'total_estudiantes' => $carrera->total_estudiantes,
                    'total_materias' => $carrera->materias->count(),
                    'director' => $this->getDirectorCarrera($carrera->nombre),
                ];
            });

        // Actividad reciente basada en datos reales de la BD
        $actividadReciente = [];

        // 1. Carreras recientes
        $carrerasRecientes = Carrera::with('facultad')
            ->latest()
            ->take(2)
            ->get();
        
        foreach ($carrerasRecientes as $carrera) {
            $actividadReciente[] = [
                'tipo' => 'carrera',
                'titulo' => 'Carrera registrada',
                'descripcion' => $carrera->nombre,
                'tiempo' => $this->formatTiempo($carrera->created_at),
                'color' => '#8b5cf6',
            ];
        }

        // 2. Usuarios recientes
        $usuariosRecientes = Usuario::with('rolesUsuario')
            ->latest()
            ->take(2)
            ->get();
        
        foreach ($usuariosRecientes as $usuario) {
            $rol = $usuario->rolesUsuario->first()?->rol ?? 'usuario';
            $actividadReciente[] = [
                'tipo' => 'usuario',
                'titulo' => 'Nuevo usuario registrado',
                'descripcion' => $usuario->nombre . ' - ' . ucfirst($rol),
                'tiempo' => $this->formatTiempo($usuario->created_at),
                'color' => '#3b82f6',
            ];
        }

        // 3. Materias recientes
        $materiasRecientes = Materia::with('carrera')
            ->latest()
            ->take(2)
            ->get();
        
        foreach ($materiasRecientes as $materia) {
            $actividadReciente[] = [
                'tipo' => 'materia',
                'titulo' => 'Materia creada',
                'descripcion' => $materia->nombre . ' (' . ($materia->carrera?->nombre ?? 'Sin carrera') . ')',
                'tiempo' => $this->formatTiempo($materia->created_at),
                'color' => '#f59e0b',
            ];
        }

        // Ordenar actividades por fecha más reciente y tomar solo 4
        $actividadReciente = collect($actividadReciente)
            ->sortByDesc(function ($item) {
                return $item['tiempo'];
            })
            ->take(4)
            ->values()
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_usuarios' => $totalUsuarios,
                'total_carreras' => $totalCarreras,
                'total_materias' => $totalMaterias,
                'total_facultades' => $totalFacultades,
                'usuarios_nuevos_mes' => $usuariosNuevos,
                'actividad_mensual' => $actividadMensual,
                'carreras_activas' => $carrerasActivas,
                'actividad_reciente' => $actividadReciente,
            ]
        ]);
    }

    public function directorStats(\Illuminate\Http\Request $request): JsonResponse
    {
        $usuario = $request->user();
        $carreraId = $this->getCarreraId($usuario);

        if (!$carreraId) {
            return response()->json([
                'success' => false,
                'message' => 'El director no tiene una carrera asignada.',
            ], 400);
        }

        $carrera = Carrera::with(['facultad', 'materias'])
            ->find($carreraId);

        if (!$carrera) {
            return response()->json([
                'success' => false,
                'message' => 'Carrera no encontrada.',
            ], 404);
        }

        // Contar directamente desde roles_usuario para mayor precisión
        // Un estudiante pertenece a la carrera si su rol tiene carrera_id = $carreraId
        // O si su usuario.carrera_id = $carreraId
        $totalEstudiantes = \App\Models\RolUsuario::where('rol', 'estudiante')
            ->where(function ($q) use ($carreraId) {
                $q->where('carrera_id', $carreraId)
                  ->orWhereHas('usuario', fn ($u) => $u->where('carrera_id', $carreraId));
            })
            ->distinct('usuario_id')
            ->count('usuario_id');

        $totalDocentes = \App\Models\RolUsuario::where('rol', 'docente')
            ->where(function ($q) use ($carreraId) {
                $q->where('carrera_id', $carreraId)
                  ->orWhereHas('usuario', fn ($u) => $u->where('carrera_id', $carreraId));
            })
            ->distinct('usuario_id')
            ->count('usuario_id');

        $totalMaterias = $carrera->materias->count();

        // Usuarios nuevos este mes en la carrera
        $estudiantesNuevos = \App\Models\RolUsuario::where('rol', 'estudiante')
            ->where(function ($q) use ($carreraId) {
                $q->where('carrera_id', $carreraId)
                  ->orWhereHas('usuario', fn ($u) => $u->where('carrera_id', $carreraId));
            })
            ->whereMonth('created_at', now()->month)
            ->distinct('usuario_id')
            ->count('usuario_id');

        $docentesNuevos = \App\Models\RolUsuario::where('rol', 'docente')
            ->where(function ($q) use ($carreraId) {
                $q->where('carrera_id', $carreraId)
                  ->orWhereHas('usuario', fn ($u) => $u->where('carrera_id', $carreraId));
            })
            ->whereMonth('created_at', now()->month)
            ->distinct('usuario_id')
            ->count('usuario_id');

        // Actividad mensual
        $actividadMensual = min(95, round((($estudiantesNuevos + $docentesNuevos) / max($totalEstudiantes + $totalDocentes, 1)) * 100 + 85));

        // Actividad reciente de la carrera
        $actividadReciente = [];

        // Usuarios recientes de la carrera
        $usuariosRecientes = \App\Models\Usuario::with('rolesUsuario')
            ->where('carrera_id', $carreraId)
            ->whereHas('rolesUsuario', function ($q) {
                $q->whereIn('rol', ['docente', 'estudiante', 'centro_estudiantes']);
            })
            ->latest()
            ->take(3)
            ->get();

        foreach ($usuariosRecientes as $usuario) {
            $rol = $usuario->rolesUsuario->first()?->rol ?? 'usuario';
            $actividadReciente[] = [
                'tipo' => 'usuario',
                'titulo' => 'Nuevo ' . ucfirst($rol) . ' registrado',
                'descripcion' => $usuario->nombre,
                'fecha' => $usuario->created_at?->toISOString(),
                'tiempo' => $this->formatTiempo($usuario->created_at),
                'color' => $rol === 'docente' ? '#0f766e' : '#be123c',
            ];
        }

        // Materias recientes de la carrera
        $materiasRecientes = Materia::where('carrera_id', $carreraId)
            ->latest()
            ->take(2)
            ->get();

        foreach ($materiasRecientes as $materia) {
            $actividadReciente[] = [
                'tipo' => 'materia',
                'titulo' => 'Materia creada',
                'descripcion' => $materia->nombre,
                'fecha' => $materia->created_at?->toISOString(),
                'tiempo' => $this->formatTiempo($materia->created_at),
                'color' => '#f59e0b',
            ];
        }

        // Ordenar actividades por fecha
        $actividadReciente = collect($actividadReciente)
            ->sortByDesc('fecha')
            ->take(4)
            ->values()
            ->toArray();

        return response()->json([
            'success' => true,
            'data' => [
                'total_usuarios' => $totalEstudiantes + $totalDocentes,
                'total_carreras' => 1,
                'total_materias' => $totalMaterias,
                'total_facultades' => 1,
                'usuarios_nuevos_mes' => $estudiantesNuevos + $docentesNuevos,
                'actividad_mensual' => $actividadMensual,
                'mi_carrera' => [
                    'id' => $carrera->id,
                    'nombre' => $carrera->nombre,
                    'facultad' => $carrera->facultad?->nombre ?? 'Sin Facultad',
                    'total_estudiantes' => $totalEstudiantes,
                    'total_docentes' => $totalDocentes,
                    'total_materias' => $totalMaterias,
                ],
                'actividad_reciente' => $actividadReciente,
            ]
        ]);
    }

    private function getDirectorCarrera(string $carreraNombre): string
    {
        $carrera = \App\Models\Carrera::where('nombre', $carreraNombre)->first();
        if (!$carrera) return 'Por asignar';

        $director = \App\Models\RolUsuario::where('rol', 'director')
            ->where('carrera_id', $carrera->id)
            ->with('usuario:id,nombre')
            ->first();

        return $director?->usuario?->nombre ?? 'Por asignar';
    }

    private function formatTiempo($fecha): string
    {
        $diff = now()->diffInMinutes($fecha);
        
        if ($diff < 60) {
            return 'Hace ' . $diff . ' minutos';
        }
        
        $diff = now()->diffInHours($fecha);
        if ($diff < 24) {
            return 'Hace ' . $diff . ' hora' . ($diff > 1 ? 's' : '');
        }
        
        $diff = now()->diffInDays($fecha);
        if ($diff < 7) {
            return 'Hace ' . $diff . ' día' . ($diff > 1 ? 's' : '');
        }
        
        $diff = now()->diffInWeeks($fecha);
        if ($diff < 4) {
            return 'Hace ' . $diff . ' semana' . ($diff > 1 ? 's' : '');
        }
        
        return 'Hace ' . now()->diffInMonths($fecha) . ' meses';
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
}
