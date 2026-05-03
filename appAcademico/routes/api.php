<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CarreraController;
use App\Http\Controllers\Api\DocenteController;
use App\Http\Controllers\Api\FacultadController;
use App\Http\Controllers\Api\MateriaController;
use App\Http\Controllers\Api\ActividadController;
use App\Http\Controllers\Api\NotificacionController;
use App\Http\Controllers\Api\UsuarioController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/seleccionar-rol', [AuthController::class, 'seleccionarRol']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'rol:decano'])->group(function () {
    Route::apiResource('facultades', FacultadController::class);
    Route::apiResource('carreras', CarreraController::class);
    Route::apiResource('materias', MateriaController::class);
    Route::apiResource('usuarios', UsuarioController::class);
    Route::post('/usuarios/{usuario}/asignar-director', [UsuarioController::class, 'asignarDirector']);
    
    // Dashboard stats endpoint
    Route::get('/dashboard/stats', [App\Http\Controllers\Api\DashboardController::class, 'stats']);

    Route::put('/notificaciones/{id}', [NotificacionController::class, 'update']);
    Route::post('/notificaciones/{id}', [NotificacionController::class, 'update']); // Para actualizar con archivos (FormData)
    Route::delete('/notificaciones/{id}', [NotificacionController::class, 'destroy']);
    
    // Actividades (listar) - solo decano
    Route::get('/actividades', [ActividadController::class, 'index']);
    Route::get('/actividades/{id}', [ActividadController::class, 'show']);
});

Route::middleware(['auth:sanctum', 'rol:docente'])->group(function () {
    Route::get('/docente/materias', [DocenteController::class, 'misMaterias']);
    Route::get('/docente/materias/{id}/estudiantes', [DocenteController::class, 'estudiantesPorMateria']);
    Route::get('/docente/materias/{id}/actividades', [DocenteController::class, 'actividadesPorMateria']);
});

Route::middleware(['auth:sanctum', 'rol:decano,docente'])->group(function () {
    Route::post('/actividades', [ActividadController::class, 'store']);
    Route::put('/actividades/{id}', [ActividadController::class, 'update']);
    Route::post('/actividades/{id}', [ActividadController::class, 'update']); // Para actualizar con archivos (FormData)
    Route::delete('/actividades/{id}', [ActividadController::class, 'destroy']);
    Route::post('/notificaciones', [NotificacionController::class, 'store']);
});

Route::middleware('auth:sanctum')->group(function () {
    // Password change endpoint - aquí movido
    Route::post('/usuarios/cambiar-password', [AuthController::class, 'changePassword']);

    // Notificaciones (listar) - cualquier usuario autenticado
    Route::get('/notificaciones', [NotificacionController::class, 'index']);
    Route::get('/notificaciones/recibidas', [NotificacionController::class, 'recibidas']);
    Route::get('/notificaciones/enviadas', [NotificacionController::class, 'enviadas']);
    
    // Dashboard stats para director - cualquier usuario autenticado (el controller verifica el rol)
    Route::get('/dashboard/director-stats', [App\Http\Controllers\Api\DashboardController::class, 'directorStats']);
    
    // Rutas para Director: Listar usuarios y materias de su carrera
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::get('/materias', [MateriaController::class, 'index']);
    
    // Rutas para Director: Crear usuarios y materias (docente/estudiante solo en su carrera)
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::post('/materias', [MateriaController::class, 'store']);
    
    // Rutas para Director: Editar usuarios y materias de su carrera
    Route::get('/usuarios/{usuario}', [UsuarioController::class, 'show']);
    Route::put('/usuarios/{usuario}', [UsuarioController::class, 'update']);
    Route::get('/materias/{materia}', [MateriaController::class, 'show']);
    Route::put('/materias/{materia}', [MateriaController::class, 'update']);
    Route::delete('/materias/{materia}', [MateriaController::class, 'destroy']);
});
