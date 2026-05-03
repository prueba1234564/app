<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Materia extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'materias';

    protected $fillable = [
        'nombre',
        'carrera_id',
    ];

    protected $casts = [];

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function horarios(): HasMany
    {
        return $this->hasMany(Horario::class, 'materia_id');
    }

    public function actividades(): HasMany
    {
        return $this->hasMany(Actividad::class, 'materia_id');
    }

    public function estudiantes(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'estudiante_materia', 'materia_id', 'usuario_id')
            ->withPivot('fecha_inscripcion')
            ->withTimestamps();
    }

    public function docentes(): BelongsToMany
    {
        return $this->belongsToMany(Usuario::class, 'docente_materia', 'materia_id', 'usuario_id')
            ->withPivot('fecha_asignacion')
            ->withTimestamps();
    }

    public function estudianteMateria(): HasMany
    {
        return $this->hasMany(EstudianteMateria::class, 'materia_id');
    }

    public function docenteMateria(): HasMany
    {
        return $this->hasMany(DocenteMateria::class, 'materia_id');
    }
}
