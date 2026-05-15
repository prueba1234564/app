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

    /** Valores válidos para el tipo de carrera */
    public const TIPO_SEMESTRAL = 'semestral';
    public const TIPO_ANUAL     = 'anual';

    protected $fillable = [
        'nombre',
        'facultad_id',
        'tipo',
        'secciones',
    ];

    protected $casts = [
        'secciones' => 'integer',
        'tipo'      => 'string',
    ];

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Devuelve true si la carrera trabaja con períodos semestrales */
    public function esSemestral(): bool
    {
        return $this->tipo === self::TIPO_SEMESTRAL;
    }

    /** Devuelve true si la carrera trabaja con períodos anuales */
    public function esAnual(): bool
    {
        return $this->tipo === self::TIPO_ANUAL;
    }

    /**
     * Tipo de período compatible con esta carrera.
     * Usado para filtrar períodos al consultar ofertas académicas.
     */
    public function tipoPeriodoCompatible(): string
    {
        return $this->esAnual() ? 'anual' : 'semestre';
    }

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
