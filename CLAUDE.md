# CRM NOVA — Servidor (NestJS 12 + Prisma + PostgreSQL)

API de un ISP **en producción**: facturación, cobranza, clientes y corte de servicio
por PPPoE sobre routers MikroTik. Lo que se rompe aquí deja gente sin internet o
altera facturas reales. Trabaja en consecuencia.

Lee antes de escribir código:
- @docs/estandar-hexagonal-crm-nova.md — **el formato obligatorio** de todo módulo hexagonal
- @docs/guia-post-auth-refactor-hexagonal-crm-nova.md — estado actual y orden de trabajo (§8)
- `docs/guia-desarrollo-cobranza-corte-crm-nova.md` — diseño funcional del corte y de los módulos
  (en estructura y nombres manda el estándar)

## Etapa actual: refactor hexagonal (después de auth + majors)

La etapa de auth y NestJS 12 está terminada en código (aún no desplegada). Ahora:

1. **H0**: piezas compartidas del estándar (§14): `DomainError`, contrato único de error,
   paginación común, `RELOJ`, `@Actor()`.
2. **C0**: arreglos rápidos en los módulos de `src/modules` (IP vía `@Actor()`, código
   muerto, guards/pipes redundantes), sin cambiar estructura ni respuestas.
3. Después: plan H1–H12 de la guía post-auth y re-conformar módulos (tandas C1–C5 del estándar).

**No empieces un paso hasta que el dueño diga que se empieza.**

Fuera de alcance salvo pedido explícito: reescribir `auth`, cambiar la lógica de cálculo de
facturas fuera del paso de saneamiento (H1), promesas de pago.

## El estándar hexagonal es ley

- Todo módulo hexagonal vive en `src/modules/<nombre>` con el árbol de §2 del estándar.
  Carpeta o patrón que no esté en el estándar = prohibido.
- Un módulo legacy se refactoriza a `src/modules/` con nombre nuevo (§15) y la carpeta vieja
  se borra al final (strangler, §11).
- Antes de dar por terminado un paso, corre el checklist de conformidad (§12) del módulo.
- Cambiar una regla del estándar = editar el documento en un commit propio, con autorización.

## Hechos del negocio

- **Una empresa por base de datos.** `empresaId` no es filtro de seguridad (§4.8 del estándar).
- Zona horaria de negocio: `America/Guatemala`. La hora sale del puerto `RELOJ`; los
  `new Date()` viejos se reemplazan cuando se toca cada módulo.
- Hay un front React en producción, un front Angular en camino y una app Android. El servidor
  marca el contrato; todo cambio visible para los clientes se anota para avisar antes del deploy.

## Git

- **`main` es solo lectura.** Nunca push ni merge hacia o desde `main` sin autorización
  explícita del dueño en ese momento.
- Trabajo activo: `refactorizaciones-hexagonales`. Puntos de control: `checkpoints-refactorizaciones`.
- Commits `refactorizacion <modulo> #N` (ej. `refactorizacion comun #1`), un propósito por commit.
- Antes de empezar: `git fetch origin && git pull --ff-only` (el dueño trabaja desde dos máquinas).

## Comandos

```bash
npm ci                      # instalar — respeta package-lock, NO uses npm install
npx prisma generate
npm run build
npm run lint:check          # NO `npm run lint`: lleva --fix y reescribe el repo
npm test                    # Jest 30 con --experimental-vm-modules
npm run start:dev
npx prisma migrate status
```

Node 24 (`.nvmrc`). Línea base: lint ≤ 410 errores (sin errores nuevos en archivos tocados);
Jest 4/15 suites en verde (las otras 11 son boilerplate roto).

## Seguridad que ya existe (no la rehagas ni la rodees)

- Guard global JWT + sesión en BD: toda ruta exige token salvo `@Public()`. No agregues
  `@UseGuards(JwtAuthGuard)` ni `ValidationPipe` locales en código nuevo.
- `@Roles(...)` para autorizar; `@OperacionSensible()` para operaciones que piden contraseña.
- ValidationPipe global estricto **sin** conversión implícita: declara todo campo en el DTO y
  convierte tipos con `@Type`/`@Transform`.
- Usuario: `req.user` (`UsuarioAutenticado`); rol/activo/empresaId vienen de la BD.
- Contraseñas solo vía `PasswordService`. El filtro global sanea los 500.
- `PartialType` y afines desde `@nestjs/swagger`.

## Reglas que no se negocian

- **No instales dependencias sin preguntar.** Ninguna.
- **Migraciones solo aditivas:** `CREATE TABLE`, `CREATE INDEX`, `ADD COLUMN` (nullable o con
  `DEFAULT`). Prohibido `DROP`, `RENAME`, cambiar tipos o quitar valores de enums. Nunca
  `migrate dev`, `migrate reset` ni `db push` contra producción; en producción solo `migrate deploy`.
- **Refactorizar = mejorar el contrato.** Un endpoint que pasa a hexagonal adopta las respuestas
  estándar (`{ data, meta }`, presenters, errores §7.5). Todo cambio visible para la UI se anota en
  `docs/cambios-contrato-ui.md` en el mismo commit. Cambiar una **ruta** se propone antes al dueño.
  Fuera de un refactor, no se tocan rutas, campos ni respuestas.
- **Nunca registres ni devuelvas** secretos, contraseñas, secretos PPPoE, tokens ni datos
  personales; los errores hacia la UI siguen el contrato de §7.5 del estándar.
- **Nada de efectos reales en pruebas locales:** no correr crons, operaciones MikroTik/PPPoE ni
  envíos de WhatsApp/Twilio/Meta. El `.env` local apunta a sistemas reales.
- `domain/` sin Nest ni Prisma; `application/` sin Prisma ni excepciones HTTP; Prisma solo en `infra/`.
- Si una decisión no está en el estándar ni en las guías y cambia comportamiento, **pregunta**.
