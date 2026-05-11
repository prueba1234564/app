<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RegistroController;
use App\Http\Controllers\Api\CarreraController;
use App\Http\Controllers\Api\DocenteController;
use App\Http\Controllers\Api\FacultadController;
use App\Http\Controllers\Api\MateriaController;
use App\Http\Controllers\Api\ActividadController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\PeriodoController;
use App\Http\Controllers\Api\UsuarioController;
use App\Http\Controllers\Api\MateriaPeriodoController;
use App\Http\Controllers\Api\HorarioController;
use App\Http\Controllers\Api\InscripcionController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/registro', [RegistroController::class, 'registro']);
    Route::post('/seleccionar-rol', [AuthController::class, 'seleccionarRol']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

// Rutas públicas para el formulario de registro de estudiantes
Route::get('/publico/carreras', [CarreraController::class, 'index']);

Route::middleware(['auth:sanctum', 'rol:decano'])->group(function () {
    Route::apiResource('facultades', FacultadController::class);
    Route::apiResource('carreras', CarreraController::class);
    Route::apiResource('materias', MateriaController::class);
    Route::apiResource('usuarios', UsuarioController::class);
    Route::put('/periodos/{id}/activar', [PeriodoController::class, 'activar']);
    Route::apiResource('periodos', PeriodoController::class)->except(['index', 'show']);
    Route::get('/materia-periodo/periodo-activo', [MateriaPeriodoController::class, 'porPeriodoActivo']);
    Route::get('/materia-periodo/docente/{docenteId}', [MateriaPeriodoController::class, 'porDocente']);
    Route::put('/materia-periodo/{id}/asignar-docente', [MateriaPeriodoController::class, 'asignarDocente']);
    Route::apiResource('materia-periodo', MateriaPeriodoController::class);
    Route::post('/usuarios/{usuario}/asignar-director', [UsuarioController::class, 'asignarDirector']);
    Route::get('/dashboard/stats', [App\Http\Controllers\Api\DashboardController::class, 'stats']);
});

Route::middleware(['auth:sanctum', 'rol:director'])->group(function () {
    // Horarios
    Route::get('/director/horarios/oferta/{id}', [HorarioController::class, 'index']);
    Route::post('/director/horarios/oferta/{id}', [HorarioController::class, 'store']);
    Route::put('/director/horarios/{id}', [HorarioController::class, 'update']);
    Route::delete('/director/horarios/{id}', [HorarioController::class, 'destroy']);
    // Inscripciones
    Route::get('/director/inscripciones', [InscripcionController::class, 'index']);
    Route::post('/director/inscripciones', [InscripcionController::class, 'store']);
    Route::delete('/director/inscripciones', [InscripcionController::class, 'destroy']);
    Route::get('/director/estudiantes-disponibles', [InscripcionController::class, 'disponibles']);
    // Materia-periodo
    Route::get('/director/materia-periodo', [MateriaPeriodoController::class, 'index']);
    Route::post('/director/materia-periodo', [MateriaPeriodoController::class, 'store']);
    Route::put('/director/materia-periodo/{id}/asignar-docente', [MateriaPeriodoController::class, 'asignarDocente']);
    Route::put('/director/materia-periodo/{id}', [MateriaPeriodoController::class, 'update']);
    Route::delete('/director/materia-periodo/{id}', [MateriaPeriodoController::class, 'destroy']);
});

Route::middleware(['auth:sanctum', 'rol:docente'])->group(function () {
    Route::get('/docente/materias', [DocenteController::class, 'misMaterias']);
    Route::get('/docente/materias/{id}/estudiantes', [DocenteController::class, 'estudiantesPorMateria']);
    Route::get('/docente/materias/{id}/actividades', [DocenteController::class, 'actividadesPorMateria']);
    Route::get('/docente/actividades', [DocenteController::class, 'misActividades']);
    Route::get('/docente/ofertas-periodo', [MateriaPeriodoController::class, 'porPeriodoActivo']);
    Route::get('/docente/historial', [DocenteController::class, 'historial']);
});

// Lectura de actividades: todos los roles autenticados pueden ver
Route::middleware(['auth:sanctum', 'rol:decano,docente,director,estudiante,centro_estudiantes,centro_facultativo'])->group(function () {
    Route::get('/actividades', [ActividadController::class, 'index']);
    Route::get('/actividades/{id}', [ActividadController::class, 'show']);
});

// Escritura de actividades: solo roles administrativos/docentes
Route::middleware(['auth:sanctum', 'rol:decano,docente,director,centro_estudiantes,centro_facultativo'])->group(function () {
    Route::post('/actividades', [ActividadController::class, 'store']);
    Route::put('/actividades/{id}', [ActividadController::class, 'update']);
    Route::post('/actividades/{id}', [ActividadController::class, 'update']); // FormData
    Route::delete('/actividades/{id}', [ActividadController::class, 'destroy']);
});
Route::middleware(['auth:sanctum', 'rol:decano,docente,director,centro_estudiantes,centro_facultativo'])->group(function () {
    Route::post('/notificaciones', [NotificacionController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'rol:decano,director'])->group(function () {
    Route::put('/notificaciones/{id}', [NotificacionController::class, 'update']);
    Route::post('/notificaciones/{id}', [NotificacionController::class, 'update']);
    Route::delete('/notificaciones/{id}', [NotificacionController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/usuarios/cambiar-password', [AuthController::class, 'changePassword']);

    Route::get('/estudiante/historial', [DocenteController::class, 'historialEstudiante']);
    Route::get('/estudiante/materias-carrera', [InscripcionController::class, 'materiasCarrera']);
    Route::post('/estudiante/inscribirse', [InscripcionController::class, 'inscribirse']);
    Route::post('/estudiante/desinscribirse', [InscripcionController::class, 'desinscribirse']);
    Route::post('/estudiante/actividades/{id}/completar', [ActividadController::class, 'completar']);
    Route::delete('/estudiante/actividades/{id}/completar', [ActividadController::class, 'descompletar']);

    Route::get('/periodos', [PeriodoController::class, 'index']);
    Route::get('/periodos/activo', [PeriodoController::class, 'activo']);
    Route::get('/periodos/{id}', [PeriodoController::class, 'show'])->whereNumber('id');

    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::get('/notificaciones/recibidas', [NotificacionController::class, 'recibidas']);
    Route::get('/notificaciones/enviadas', [NotificacionController::class, 'enviadas']);
    Route::post('/notificaciones/{id}/leer', [NotificacionController::class, 'marcarComoLeida']);

    Route::get('/dashboard/director-stats', [App\Http\Controllers\Api\DashboardController::class, 'directorStats']);

    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::get('/materias', [MateriaController::class, 'index']);

    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::post('/materias', [MateriaController::class, 'store']);

    Route::get('/usuarios/{usuario}', [UsuarioController::class, 'show']);
    Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update']);
    Route::get('/materias/{materia}', [MateriaController::class, 'show']);
    Route::put('/materias/{materia}', [MateriaController::class, 'update']);
    Route::delete('/materias/{materia}', [MateriaController::class, 'destroy']);
});
