<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Modelo Periodo — dos niveles:
 *
 *  Nivel 1 — Año académico (lo gestiona el decano)
 *    tipo = 'anio_academico', anio_academico_id = null, carrera_id = null
 *
 *  Nivel 2 — Período de carrera (lo gestiona el director)
 *    tipo = 'semestre' | 'anual' | 'temporada'
 *    anio_academico_id = id del año padre
 *    carrera_id        = id de la carrera
 */
class Periodo extends Model
{
    // ─── Tipos ───────────────────────────────────────────────────────────────
    public const TIPO_ANIO_ACADEMICO = 'anio_academico';
    public const TIPO_SEMESTRE       = 'semestre';
    public const TIPO_ANUAL          = 'anual';
    public const TIPO_TEMPORADA      = 'temporada';

    /** Tipos válidos para períodos de carrera (nivel director) */
    public const TIPOS_CARRERA = [
        self::TIPO_SEMESTRE,
        self::TIPO_ANUAL,
        self::TIPO_TEMPORADA,
    ];

    /** Compatibilidad tipo de carrera → tipos de período aceptados */
    public const COMPATIBILIDAD = [
        'semestral' => [self::TIPO_SEMESTRE, self::TIPO_TEMPORADA],
        'anual'     => [self::TIPO_ANUAL,    self::TIPO_TEMPORADA],
    ];

    // ─── Eloquent ─────────────────────────────────────────────────────────────
    protected $table = 'periodos';

    protected $fillable = [
        'nombre',
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'activo',
        'anio_academico_id',
        'carrera_id',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin'    => 'date',
        'activo'       => 'boolean',
    ];

    // ─── Scopes ───────────────────────────────────────────────────────────────

    /** Solo años académicos (nivel decano) */
    public function scopeAniosAcademicos(Builder $query): Builder
    {
        return $query->where('tipo', self::TIPO_ANIO_ACADEMICO);
    }

    /** Solo períodos de carrera (nivel director) */
    public function scopePeriodosCarrera(Builder $query): Builder
    {
        return $query->where('tipo', '!=', self::TIPO_ANIO_ACADEMICO);
    }

    /** Períodos vigentes hoy */
    public function scopeVigenteHoy(Builder $query): Builder
    {
        $hoy = now()->toDateString();
        return $query
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->whereDate('fecha_fin',    '>=', $hoy);
    }

    /** Períodos compatibles con el tipo de carrera */
    public function scopeCompatibleConCarrera(Builder $query, string $tipoCarrera): Builder
    {
        $tiposAceptados = self::COMPATIBILIDAD[$tipoCarrera]
            ?? self::TIPOS_CARRERA;

        return $query->whereIn('tipo', $tiposAceptados);
    }

    // ─── Relaciones ───────────────────────────────────────────────────────────

    /** Año académico padre (solo para períodos de carrera) */
    public function anioAcademico(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'anio_academico_id');
    }

    /** Períodos hijos (solo para años académicos) */
    public function periodosHijos(): HasMany
    {
        return $this->hasMany(Periodo::class, 'anio_academico_id');
    }

    /** Carrera a la que pertenece (solo para períodos de director) */
    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function ofertas(): HasMany
    {
        return $this->hasMany(MateriaPeriodo::class, 'periodo_id');
    }

    public function materias(): BelongsToMany
    {
        return $this->belongsToMany(
            Materia::class,
            'materia_periodo',
            'periodo_id',
            'materia_id'
        )
        ->withPivot('docente_id', 'estado', 'observaciones')
        ->withTimestamps();
    }
}
