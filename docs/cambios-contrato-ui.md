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
