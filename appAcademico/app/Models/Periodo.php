<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Periodo extends Model
{
    protected $table = 'periodos';

    protected $fillable = [
        'nombre',
        'tipo',
        'fecha_inicio',
        'fecha_fin',
        'activo',
    ];

    protected $casts = [
        'fecha_inicio' => 'date',
        'fecha_fin' => 'date',
        'activo' => 'boolean',
    ];

    public function scopeVigenteHoy(Builder $query): Builder
    {
        $hoy = now()->toDateString();

        return $query
            ->whereDate('fecha_inicio', '<=', $hoy)
            ->whereDate('fecha_fin', '>=', $hoy);
    }

    public function ofertas(): HasMany
    {
        return $this->hasMany(MateriaPeriodo::class, 'periodo_id');
    }

    public function materias(): BelongsToMany
    {
        return $this->belongsToMany(Materia::class, 'materia_periodo', 'periodo_id', 'materia_id')
            ->withPivot('docente_id', 'estado', 'observaciones')
            ->withTimestamps();
    }
}
