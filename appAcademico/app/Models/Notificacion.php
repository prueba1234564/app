<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notificacion extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'notificaciones';

    protected $fillable = [
        'titulo',
        'cuerpo',
        'ruta_archivo',
        'enviado_por',
        'rol_destino',
        'rol_destino_array',
        'carrera_id',
        'carrera_ids',
        'facultad_id',
        'actividad_id',
    ];

    protected $casts = [
        'rol_destino' => 'string',
        'rol_destino_array' => 'array',
        'carrera_ids' => 'array',
    ];

    public function emisor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'enviado_por');
    }

    public function carrera(): BelongsTo
    {
        return $this->belongsTo(Carrera::class, 'carrera_id');
    }

    public function facultad(): BelongsTo
    {
        return $this->belongsTo(Facultad::class, 'facultad_id');
    }

    public function actividad(): BelongsTo
    {
        return $this->belongsTo(Actividad::class, 'actividad_id');
    }

    public function notificacionesLeidas(): HasMany
    {
        return $this->hasMany(NotificacionLeida::class, 'notificacion_id');
    }
}
