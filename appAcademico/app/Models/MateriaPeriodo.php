<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MateriaPeriodo extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'materia_periodo';

    protected $fillable = [
        'periodo_id',
        'materia_id',
        'docente_id',
        'paralelo',
        'estado',
        'observaciones',
    ];

    protected $casts = [
        'estado' => 'string',
    ];

    public function periodo(): BelongsTo
    {
        return $this->belongsTo(Periodo::class, 'periodo_id');
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function docente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'docente_id');
    }

    public function horarios(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Horario::class, 'materia_periodo_id');
    }

    public function scopeActiva($query)
    {
        return $query->where('estado', 'activa');
    }

    public function scopeDelPeriodo($query, $periodoId)
    {
        return $query->where('periodo_id', $periodoId);
    }

    public function scopeDelDocente($query, $docenteId)
    {
        return $query->where('docente_id', $docenteId);
    }
}
