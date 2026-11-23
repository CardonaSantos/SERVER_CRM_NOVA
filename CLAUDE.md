# CRM NOVA — Servidor (NestJS + Prisma + PostgreSQL)

API de un ISP **en producción**: facturación, cobranza, clientes y corte de servicio
por PPPoE sobre routers MikroTik. Lo que se rompe aquí deja gente sin internet o
altera facturas reales. Trabaja en consecuencia.

El plan completo de esta etapa está en @docs/guia-auth-majors-crm-nova.md —
léelo antes de escribir código.

## Etapa actual: SOLO auth y actualización de versiones

Hay exactamente dos trabajos en curso y nada más:

1. **Seguridad de autenticación y autorización.**
2. **Subir NestJS 10 → 11 → 12** y las dependencias que eso arrastra.

**Fuera de alcance hasta nuevo aviso:** refactorizaciones hexagonales, mover
módulos legacy a `domain/application/infra`, el módulo de cobranza y corte por
mora, y cualquier cambio de lógica de negocio. Todo eso va **después** de que esta
etapa esté estable y desplegada. Si ves código legacy que te dan ganas de
arreglar, anótalo y sigue adelante: aquí no se arregla.

Esto deja en pausa el checklist §13 de la guía de cobranza. No lo empieces.

## Git

- **`main` es solo lectura.** Nunca hagas push ni merge hacia o desde `main` sin
  autorización explícita del dueño en ese momento.
- Trabajo activo: rama `refactorizaciones-hexagonales`.
- Puntos de control estables: rama `checkpoints-refactorizaciones`.
- Mensajes de commit numerados: `refactorizacion <modulo> #N`
  (ej. `refactorizacion auth #1`), para poder volver a cualquier punto por número.
- Un commit = un propósito. Nada de commits de 300 archivos.
- Antes de empezar a trabajar: `git fetch origin && git pull --ff-only`
  (el dueño trabaja desde dos máquinas).

## Comandos

```bash
npm ci                      # instalar — respeta package-lock, NO uses npm install
npm run build               # compilar
npm run lint
npm run start:dev           # arrancar en local
npx prisma generate
npx prisma migrate status
```

## Reglas que no se negocian

- **No instales dependencias sin preguntar.** Ninguna.
- **Migraciones solo aditivas:** `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN`
  (nullable o con `DEFAULT`). Prohibido `DROP`, `RENAME`, cambiar tipos o quitar
  valores de enums. Nunca `migrate dev`, `migrate reset` ni `db push` contra
  producción; en producción solo `migrate deploy`.
- **No cambies rutas, nombres de campos ni formas de respuesta** de endpoints
  existentes: hay un front React en producción consumiéndolos.
- **Nunca registres secretos, contraseñas, secretos PPPoE ni tokens** en logs,
  código o commits.
- Zona horaria de negocio: `America/Guatemala`. Nunca un `new Date()` suelto para
  fechas de negocio.
- Si una decisión no está en la guía y cambia el comportamiento, **pregunta**.
  No la inventes.

## Antes de tocar código

Corre `npm ci && npx prisma generate && npm run build && npm run lint` y reporta
el estado. **No empieces hasta que el dueño confirme la línea base.** Si algo de
eso ya falla hoy, ese es el primer trabajo, no el upgrade.

## Lo que ya sabemos (no lo re-descubras)

Auditado en el commit `108c6ef`:

- **87 controladores, 72 sin ningún `UseGuards`**; ~396 endpoints HTTP, la mayoría
  abiertos, incluidos suspender y reactivar clientes, borrar pagos y crear usuarios.
- **Los JWT no expiran:** `auth.module.ts` registra el JWT sin `signOptions` y
  `auth.service.ts` firma sin `expiresIn`. La palabra `expiresIn` no aparece en `src/`.
- **`POST /auth/regist-user` es público:** cualquiera puede crearse un `SUPER_ADMIN`.
- **No hay `ValidationPipe` global:** los DTOs legacy son decorativos. Solo 15
  controladores nuevos lo aplican por ruta.
- No hay tabla de sesiones, ni refresh token, ni forma de revocar nada. Desactivar
  un usuario no lo saca del sistema.
- Sin `helmet`, sin `@nestjs/throttler`, sin `trust proxy` (corre detrás del proxy
  de Railway, así que `req.ip` no es la IP del cliente).
- **No hay red de pruebas:** 14 de los 15 `.spec.ts` son el boilerplate del CLI.
  La verificación es compilar, arrancar y la lista de humo de la guía.
