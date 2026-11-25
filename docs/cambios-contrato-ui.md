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
