# CRM NOVA (servidor) — Eventos en tiempo real

> Contrato de Socket.IO para las interfaces (Angular, app Android). Lo mantiene el servidor: todo
> evento nuevo o cambiado se anota aquí y en `cambios-contrato-ui.md` en el mismo commit.
>
> Código: `src/common/tiempo-real/` (conexión y salas) y el adaptador `infra/websocket/` de cada
> módulo (nombre y datos de sus eventos).

## 1. Conexión

| Dato | Valor |
|---|---|
| URL | La misma base de la API |
| Namespace | `/ws` |
| Path | `/socket.io` (el de Socket.IO) |
| Transporte | `websocket` |
| Token | `auth: { token: "Bearer <access token>" }` (también sin `Bearer`). O la cabecera `Authorization: Bearer …` en clientes que la permitan. **No** por query |

El servidor no escucha eventos del cliente: solo emite.

```ts
const socket = io(`${API_URL}/ws`, {
  transports: ['websocket'],
  // Función: Socket.IO la vuelve a llamar en cada intento, así siempre va el token vigente.
  auth: (cb) => cb({ token: `Bearer ${sesion.accessToken()}` }),
});
```

## 2. Errores y reconexión

Los errores traen la misma forma que en HTTP: `{ codigo, message }`. `message` se puede mostrar
tal cual; la UI decide con `codigo`.

**Al conectar** (el servidor rechaza el handshake): llega `connect_error` y los datos están en
`err.data`.

```ts
socket.on('connect_error', async (err) => {
  const codigo = (err as { data?: { codigo?: string } }).data?.codigo;
  if (codigo === 'TOKEN_EXPIRADO') await sesion.refrescar(); // POST /auth/refresh
  if (codigo === 'SESION_REVOCADA') sesion.cerrar();           // volver al login
  // Socket.IO reintenta solo; con `auth` como función usa el token nuevo.
});
```

**Ya conectado** (el servidor cierra): primero llega el evento `error` con `{ codigo, message }` y
luego `disconnect` con motivo `io server disconnect`. En ese caso Socket.IO **no** reconecta
solo: hay que llamar `socket.connect()`.

```ts
socket.on('error', async ({ codigo }) => {
  if (codigo === 'TOKEN_EXPIRADO') { await sesion.refrescar(); socket.connect(); }
  if (codigo === 'SESION_REVOCADA') sesion.cerrar();
});
```

| `codigo` | Cuándo | Qué hacer |
|---|---|---|
| `NO_AUTENTICADO` | Sin token, token inválido o sin sesión | Ir al login |
| `TOKEN_EXPIRADO` | Al conectar con un token vencido, o cuando vence el token del socket abierto (cada access token dura 20 min) | Renovar (`POST /auth/refresh`) y reconectar |
| `SESION_REVOCADA` | La sesión se cerró (logout, otra sesión la cerró, usuario desactivado) o expiró | Cerrar sesión en la UI |
| `ERROR_INTERNO` | Falló el servidor al validar | Reintentar (Socket.IO lo hace solo) |

El rol con el que se reciben los eventos se toma al conectar. Si cambia, se aplica en la siguiente
reconexión (a más tardar cuando vence el token).

## 3. Quién recibe qué

| Destino | Quiénes |
|---|---|
| Oficina | `SUPER_ADMIN`, `ADMIN`, `COORDINADOR_OPERACIONES`, `OFICINA` |
| Usuario | Solo los usuarios indicados |
| Todos | Toda sesión conectada |

Un usuario que cae en dos destinos del mismo evento lo recibe una sola vez.

## 4. Eventos

Nombres `<contexto>:<hecho>`, en español. Fechas en ISO 8601. Los eventos avisan qué cambió;
para el estado completo la pantalla vuelve a pedir el recurso por HTTP.

### `facturacion:cambiada`
- **Para:** oficina.
- **Cuándo:** se emite, edita o elimina una factura, o se registra o elimina un pago.
- **Datos:** `{}`.
- **UI:** volver a pedir lo que muestre de facturas o pagos.

### `ruta-cobro:cambiada`
- **Para:** oficina.
- **Cuándo:** se crea, edita, cierra o elimina una ruta.
- **Datos:** `{ rutaId: number }`.

### `ticket-soporte:estado-cambiado`
- **Para:** oficina.
- **Cuándo:** un ticket cambia de estado (iniciar, enviar a revisión, devolver, resolver,
  cancelar, reabrir).
- **Datos:**
  ```ts
  { ticketId: number; estado: string; titulo: string | null; tecnico: string | null }
  ```
  `estado` es el valor guardado (puede ser uno antiguo); `tecnico` es el nombre del técnico.

### `ticket-soporte:asignacion-cambiada`
- **Para:** solo los usuarios que entran o salen del ticket (si alguien pasa de principal a apoyo
  no recibe nada).
- **Cuándo:** al crear un ticket con técnicos o al cambiar su asignación.
- **Datos:**
  ```ts
  {
    ticketId: number;
    cambio: 'ASIGNADO' | 'RETIRADO';
    motivo: 'CREACION' | 'REASIGNACION';
    titulo: string | null;
    estado: string;
    prioridad: string;
    ocurridoEn: string;
  }
  ```
- Además llega un push al teléfono (ver el módulo de notificaciones).

### `tracking:ubicacion-actualizada`
- **Para:** oficina y el propio técnico.
- **Cuándo:** la app del técnico registra un punto (`POST real-time-location/tracking/location`).
- **Datos:** la misma forma que un elemento de `GET real-time-location/tracking/realtime`,
  **sin** `tecnico.telefono`:
  ```ts
  {
    tecnico: { id; nombre; rol; avatarUrl };
    tracking: { sesionId; asistenciaId; minutosSesionActual; estado; iniciadoEn; ultimoHeartbeatEn };
    jornada: { fecha; horaEntrada; horaSalida; sesionesTotal; sesionesFinalizadas; sesionesExpiradas;
               minutosTracking; minutosJornadaConfirmados; minutosSinTrackingConfirmados };
    ubicacion: { latitud; longitud; precision; velocidad; bateria; capturadoEn; recibidoEn } | null;
    actividad: { ticketsEnProceso: Array<{ id; titulo; estado; prioridad }> };
  }
  ```
- **UI:** reemplazar la fila del técnico `tecnico.id` (y mover su marcador). El mapa de
  `GET real-time/last-locations` se carga por HTTP y se mantiene con este evento.

### `tracking:estado-cambiado`
- **Para:** oficina y el propio técnico.
- **Cuándo:** una sesión de tracking inicia, finaliza o expira.
- **Datos:**
  ```ts
  {
    tecnicoId: number;
    sesionTrackingId: number;
    asistenciaId: number;
    estado: 'ACTIVA' | 'FINALIZADA' | 'EXPIRADA';
    iniciadoEn: string;
    finalizadoEn: string | null;
    ultimoHeartbeatEn: string;
  }
  ```

### `mensajeria-cliente:mensaje-recibido`
- **Para:** oficina.
- **Cuándo:** el bot de WhatsApp avisa que guardó un mensaje
  (`POST /mensajeria-cliente/bot/mensajes`).
- **Datos:** `{ wamid: string; recibidoEn: string }`.
- **UI:** volver a pedir la lista de chats y el chat abierto.

### `notificacion:creada` (provisional)
- **Para:** todos.
- **Cuándo:** se crea una notificación del sistema.
- **Datos:** hoy, el registro de la notificación tal como lo guarda el módulo legacy. Su forma y
  su audiencia se definen al refactorizar `notificacion` (paso 12): no construir sobre sus campos.

## 5. Integración del bot (servidor a servidor)

`POST /mensajeria-cliente/bot/mensajes` con la cabecera `x-internal-secret` y el cuerpo
`{ "wamid": "<id del mensaje>" }` (solo ese campo). Responde `204`. Sin secreto válido → `401`;
cuerpo inválido → `400 VALIDACION`. Reemplaza a `POST /internal/server/broadcast`, que ya no
existe: **el bot debe actualizarse** antes del deploy.
