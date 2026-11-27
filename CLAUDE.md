# CRM NOVA — Servidor (NestJS 12 + Prisma + PostgreSQL)

API de un ISP **en producción**: facturación, cobranza, clientes y corte de servicio
por PPPoE sobre routers MikroTik. Lo que se rompe aquí deja gente sin internet o
altera facturas reales. Trabaja en consecuencia.

Lee antes de escribir código:
- @docs/estandar-hexagonal-crm-nova.md — **el formato obligatorio** de todo módulo hexagonal
- @docs/guia-fase-legacy-crm-nova.md — **estado actual, siguiente paso y cómo refactorizar el legacy** (léela completa)
- `docs/guia-post-auth-refactor-hexagonal-crm-nova.md` — historia de la etapa auth y orden original (§8.4)
- `docs/guia-desarrollo-cobranza-corte-crm-nova.md` — diseño funcional del corte y de los módulos
  (en estructura y nombres manda el estándar)

## Etapa actual: refactor hexagonal (después de auth + majors)

La etapa de auth y NestJS 12 está terminada en código (aún no desplegada). Ahora:

1. ✅ **H0**: piezas compartidas del estándar (§14): `DomainError`, contrato único de error,
   paginación común, `RELOJ`, `@Actor()`.
2. ✅ **C0**: arreglos rápidos en `src/modules` (IP desde `req.ip`, código muerto, guards/pipes
   redundantes).
3. ✅ **C1**: `mikrotik-ssh`, `mikrotik-router-credentials`, `pppoe-credentials` y
   `almacenamiento-media` (antes `digital-ocean-media`) conformes.
4. ✅ **C2**: núcleo PPPoE (`pppoe-auditoria`, `pppoe-operacion`, `pppoe-acceso-internet`,
   `pppoe-perfil-homologacion`, `pppoe-cliente-cuenta`) conforme, cada uno con su fachada.
5. ✅ **C3**: `pppoe-automatizacion` conforme: el motor usa solo fachadas (`PPPOE_OPERACION`…),
   la adopción es atómica con la unidad de trabajo (`src/common/transaccion`).
6. ✅ **C4**: `cliente-instalacion` y `cliente-desinstalacion` conformes (consumen el núcleo PPPoE por fachadas; `ppoe-instalacion-acceso` quedó fusionado en `cliente-instalacion`).
7. ✅ **C5**: `ticket-soporte-historial`, `ticket-soporte-conformidad` (sin el flujo de enlace público, descartado) y `real-time-location` conformes. `excel-reports` y `reports` quedan fuera: se resuelven en el módulo `reporte` de la fase legacy.
8. **En curso**: fase legacy, en el orden de `docs/guia-fase-legacy-crm-nova.md` §3.2: ✅ limpieza de
   lo que no se usa, ✅ **H1** (saneamiento de estados, §6.1), ✅ paso 3 (ubicación de técnicos en
   `real-time-location`), ✅ paso 4 (`cliente`), ✅ paso 5 (`zona-facturacion`), ✅ paso 6
   (`facturacion`) y ✅ paso 7 (`mensajeria-cliente`); H2 (roles) queda en espera del dueño; sigue
   el paso 8 (`ruta-cobro`). **Los crons van al final**; reportes queda aplazado.

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
- Hay un front React en producción, un front Angular en camino y una app Android. La UI nueva
  (Angular) se construye alrededor del servidor: el servidor marca el contrato y no se ata al React
  actual. Todo cambio visible para los clientes se anota.
- El saldo de un cliente se calcula desde sus facturas; no es un registro que se suba o baje.

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

Node 24 (`.nvmrc`). Línea base: lint ≤ 158 errores (tras el paso 7; sin errores nuevos en
archivos tocados); Jest: las suites de `src/common`, `src/auth/decoradores` y de `src/modules` en
verde; 2 suites boilerplate de `location` siguen rotas.

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
