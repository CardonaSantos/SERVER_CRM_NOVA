# CRM NOVA (servidor) — Cambios de contrato para la UI

> Registro de todo cambio visible para los clientes del servidor (front React, front Angular,
> app Android). Cada entrada se agrega **en el mismo commit** que hace el cambio.
> Sirve como lista de tareas para adaptar la UI antes del deploy.
>
> Los cambios de la etapa auth + majors (refresh token, 401, sockets, bodies estrictos) están en
> §4 y §6 de `guia-post-auth-refactor-hexagonal-crm-nova.md`.

## Formatos estándar (referencia rápida)

**Error** (todas las rutas):
```json
{ "statusCode": 409, "codigo": "CODIGO_ESTABLE", "message": "Texto para el usuario.",
  "campos": [{ "campo": "nombre", "mensajes": ["…"] }], "requestId": "…" }
```
La UI decide con `codigo`, muestra `message`, marca inputs con `campos` (solo validación) y
muestra `requestId` como código de soporte en los 500.

**Listado paginado:**
```
GET /recurso?page=1&limit=20&search=…&sortBy=…&sortDir=asc|desc&<filtros>
→ { "data": [ … ], "meta": { "total": 0, "page": 1, "limit": 20, "totalPages": 0 } }
```

---

## Registro

| Fecha | Commit | Ruta(s) | Cambio | Qué debe hacer la UI |
|---|---|---|---|---|
| 24-nov-2026 | `refactorizacion comun #2` | **Todas** | Contrato único de error: todo error trae `statusCode`, `codigo`, `message` (siempre texto), `requestId` y, en validación, `campos`. Se elimina el campo `error` ("Bad Request"…) y el `errorCode` de los 500 pasa a `codigo`. Los 400 de validación ya **no** traen `message` como arreglo: `message` = "Hay datos inválidos en la solicitud." y el detalle por campo va en `campos`. Las frases genéricas en inglés de Nest ("Unauthorized", "Forbidden resource", "Cannot GET …") ahora salen en español | Un solo interceptor de errores: decidir con `codigo` (`NO_AUTENTICADO` → refrescar/login, `VALIDACION` → marcar `campos`, `ERROR_INTERNO` → mostrar `requestId` como código de soporte), mostrar `message`. Dejar de leer `message` como arreglo y `error` |
| 24-nov-2026 | `refactorizacion comun #2` | `banrural-integration` | Sus 400/404 traían `{ success, status, error }`; ahora salen con el contrato único (el texto de `error` pasa a `message`). Banrural aún no está integrado | Ninguna en la UI; tenerlo en cuenta al integrar el banco (paso H12) |
| 24-nov-2026 | `refactorizacion almacenamiento-media #2` | `POST /media/batch`, `POST /media/delete` | Rutas y respuestas iguales (`{ count, items }` y `{ id, eliminado }`). Cambian los errores, que antes salían como 500: sin archivos → 400 `SIN_ARCHIVOS`; archivo vacío → 400 `ARCHIVO_VACIO`; tipo no reconocible → 400 `TIPO_ARCHIVO_NO_RECONOCIDO`; `items` con JSON inválido → 400 `METADATOS_ARCHIVOS_INVALIDOS`; media inexistente al borrar → 404 `MEDIA_NO_ENCONTRADA` | Mostrar `message`; opcionalmente reaccionar a esos `codigo` |
| 24-nov-2026 | `refactorizacion almacenamiento-media #3` | `POST /media/batch` | `empresaId` y `subidoPorId` del body se **ignoran**: la empresa y quien sube salen de la sesión (antes el cliente podía declarar otro usuario). Se siguen aceptando para no romper. Los demás campos se validan: `clienteId`/`albumId` enteros positivos, `publico` `true`/`false`/`1`/`0`, `categoria` y `tipo` de sus listas, `basePrefix` ≤ 100; un campo no declarado o inválido → 400 `VALIDACION` con `campos` | Dejar de enviar `empresaId` y `subidoPorId`; no enviar campos extra |
| 24-nov-2026 | `refactorizacion almacenamiento-media #3` | `POST /media/delete` | El query `empresaId` ya no es obligatorio ni se usa (sale de la sesión) | Puede dejar de enviarlo |
| 24-nov-2026 | `refactorizacion pppoe-auditoria #3` | `GET /cliente-instalaciones/:id/auditoria-pppoe` | Rol por `@Roles(ROLES_OFICINA)`: el 403 ahora es el genérico ("No tiene permisos para esta operación.", `PROHIBIDO`). Instalación inexistente → 404 `INSTALACION_NO_ENCONTRADA` ("No se encontró la instalación."). `fechaDesde`/`fechaHasta` sin hora (`YYYY-MM-DD`) se interpretan como días completos en Guatemala (antes, medianoche UTC) | Mostrar `message` |
| 24-nov-2026 | `refactorizacion pppoe-auditoria #3` | `GET /pppoe-auditoria` | El query `empresaId` deja de ser obligatorio y se ignora (sale de la sesión). Fechas sin hora = días completos en Guatemala (antes, día UTC del proceso). Fecha inválida → 400 `FECHA_INVALIDA`; desde > hasta → 400 `RANGO_FECHAS_INVALIDO` | Puede dejar de enviar `empresaId` |
| 24-nov-2026 | `refactorizacion pppoe-auditoria #6` | `GET /pppoe-auditoria` | Ahora exige rol de oficina (`ROLES_OFICINA`: SUPER_ADMIN, ADMIN, COORDINADOR_OPERACIONES, OFICINA). Un TÉCNICO recibe 403 genérico `PROHIBIDO` ("No tiene permisos para esta operación.") | Ocultar la bitácora a técnicos o mostrar `message` |
