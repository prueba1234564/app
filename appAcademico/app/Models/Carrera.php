<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Carrera extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'carreras';

    protected $fillable = [
        'nombre',
        'facultad_id',
    ];

    protected $casts = [];

    public function facultad(): BelongsTo
    {
        return $this->belongsTo(Facultad::class, 'facultad_id');
    }

    public function materias(): HasMany
    {
        return $this->hasMany(Materia::class, 'carrera_id');
    }

    public function usuarios(): HasMany
    {
        return $this->hasMany(Usuario::class, 'carrera_id');
    }

    public function rolesUsuario(): HasMany
    {
        return $this->hasMany(RolUsuario::class, 'carrera_id');
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class, 'carrera_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'carrera_id');
    }
}
