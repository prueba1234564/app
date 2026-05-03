<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Actividad extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'actividades';

    protected $fillable = [
        'titulo',
        'descripcion',
        'categoria',
        'fecha_entrega',
        'ruta_archivo',
        'creado_por',
        'materia_id',
        'carrera_id',
        'rol_destino',
    ];

    protected $casts = [
        'categoria' => 'string',
        'fecha_entrega' => 'datetime',
        'rol_destino' => 'string',
    ];

    public function creador(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'creado_por');
    }

    public function materia(): BelongsTo
    {
        return $this->belongsTo(Materia::class, 'materia_id');
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'actividad_id');
    }
}
