<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasMany as HasManyRelation;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'usuarios';

    protected $fillable = [
        'nombre',
        'email',
        'registro_universitario',
        'password',
        'matricula_pdf',
        'esta_verificado',
        'carrera_id',
        'facultad_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'esta_verificado' => 'boolean',
        'password' => 'hashed',
    ];

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function facultad(): BelongsTo
    {
        return $this->belongsTo(Facultad::class, 'facultad_id');
    }

    public function rolesUsuario(): HasMany
    {
        return $this->hasMany(RolUsuario::class, 'usuario_id');
    }

    public function roles(): HasManyRelation
    {
        return $this->rolesUsuario();
    }

    public function materiasComoEstudiante(): BelongsToMany
    {
        return $this->belongsToMany(Materia::class, 'estudiante_materia', 'usuario_id', 'materia_id')
            ->withPivot('fecha_inscripcion')
            ->withTimestamps();
    }

    public function materiasComoDocente(): BelongsToMany
    {
        return $this->belongsToMany(Materia::class, 'docente_materia', 'usuario_id', 'materia_id')
            ->withPivot('fecha_asignacion')
            ->withTimestamps();
    }

    public function estudianteMateria(): HasMany
    {
        return $this->hasMany(EstudianteMateria::class, 'usuario_id');
    }

    public function docenteMateria(): HasMany
    {
        return $this->hasMany(DocenteMateria::class, 'usuario_id');
    }

    public function actividadesCreadas(): HasMany
    {
        return $this->hasMany(Actividad::class, 'creado_por');
    }

    public function notificacionesEnviadas(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'enviado_por');
    }

    public function notificacionesLeidas(): HasMany
    {
        return $this->hasMany(NotificacionLeida::class, 'usuario_id');
    }

    public function ofertasDocente(): HasMany
    {
        return $this->hasMany(MateriaPeriodo::class, 'docente_id');
    }

    public function materiasPeriodo(): BelongsToMany
    {
        return $this->belongsToMany(Materia::class, 'materia_periodo', 'docente_id', 'materia_id')
            ->withPivot('periodo_id', 'estado', 'observaciones')
            ->withTimestamps();
    }
}
