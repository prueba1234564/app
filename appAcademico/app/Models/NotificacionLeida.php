<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificacionLeida extends Model
{
    use HasFactory;

    protected $table = 'notificaciones_leidas';

    protected $fillable = [
        'notificacion_id',
        'usuario_id',
        'leido_en',
    ];

    protected $casts = [
        'leido_en' => 'datetime',
    ];

    public function notificacion(): BelongsTo
    {
        return $this->belongsTo(Notificacion::class, 'notificacion_id');
    }

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }
}
