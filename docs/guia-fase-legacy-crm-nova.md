# CRM NOVA (servidor) — Guía de la fase legacy (H1–H12 y resto de `src/`)

> **Para quién es:** para cada chat nuevo de Claude Code que siga el refactor, y para el dueño.
> Este documento reemplaza el contexto de conversaciones anteriores: si lo lees completo junto con
> `CLAUDE.md` y `docs/estandar-hexagonal-crm-nova.md`, tienes todo lo necesario para continuar.
>
> | Dato | Valor |
> |---|---|
> | Fecha | 26-nov-2026 |
> | Rama de trabajo | `refactorizaciones-hexagonales` (usa la punta; el estado de cada paso está en §3.2) |
> | Punto de control | `checkpoints-refactorizaciones` en `ee2b197` |
> | Producción (`main`) | `108c6ef`: **nada de este trabajo está desplegado** |
> | Prioridad de documentos | 1) `estandar-hexagonal-crm-nova.md` (forma de todo módulo) · 2) esta guía (qué sigue y cómo) · 3) `guia-post-auth-refactor-hexagonal-crm-nova.md` (historia de auth, §8.4 orden original) |

---

## 0. Cómo arrancar un chat nuevo (léelo primero)

1. `git fetch origin && git checkout refactorizaciones-hexagonales && git pull --ff-only`
   (el dueño trabaja desde dos máquinas).
2. Lee `CLAUDE.md`, `docs/estandar-hexagonal-crm-nova.md` y **esta guía**. No hace falta leer la
   guía post-auth completa salvo que necesites detalles de auth.
3. Mira §3.2 (orden de trabajo) para saber cuál es el **siguiente paso pendiente**. La columna Estado se
   actualiza al cerrar cada paso.
4. **No empieces a cambiar código hasta que el dueño diga que se empieza ese paso.** Primero
   presenta: inventario del módulo (rutas, crons, consumidores), propuesta de nombres y rutas,
   bugs detectados, y las preguntas abiertas del paso (§7). Espera su respuesta.
5. Línea base antes de tocar nada: `npm run build` (verde) y `npm run lint:check` (no más errores que la línea base de §2.3).
   No corras `npm ci` salvo que falten dependencias; nunca `npm install`.

---

## 1. Qué se busca

El objetivo no es solo "mover a hexagonal". Cada módulo que se refactoriza termina **profesional
de punta a punta**:

- **Estructura** del estándar (§2 del estándar), en `src/modules/<nombre-nuevo>/`, y la carpeta
  legacy se **borra** al final (strangler).
- **Contrato mejorado** hacia la UI: presenters con lista blanca, listados `{ data, meta }`,
  errores con `codigo` estable (§7.5), fechas ISO, sin campos internos ni datos personales que la
  pantalla no use. Cada cambio visible se anota en `docs/cambios-contrato-ui.md` en el mismo commit.
- **Autorización real**: `@Roles(...ROLES_OFICINA)` / `ROLES_TECNICO` en cada ruta (hoy el legacy
  casi no tiene roles: cualquier usuario autenticado puede borrar pagos o editar facturas).
- **Bugs reales corregidos**: estados que se pisan, fechas en UTC en vez de Guatemala, escrituras
  no atómicas, `count` y `findMany` desalineados, N+1, errores 500 que deberían ser 400/404/409.
  La refactorización es la oportunidad de arreglarlos (§6), pero **un cambio de comportamiento que
  no esté decidido en el estándar o en esta guía se pregunta al dueño**.
- **Pruebas**: specs de entidades, policies y casos de uso con fakes (`test/fakes`), sin Nest
  `TestingModule`.

---

## 2. Estado actual del repo

### 2.1 Terminado (no rehacer)

| Tanda | Qué | Resultado |
|---|---|---|
| Auth + majors | NestJS 12, TS 6, Node 24, ESLint 10, Jest 30; guard JWT global estricto, sesiones en BD, refresh rotativo, `@Roles`, `@OperacionSensible`, pipe global estricto, filtro global | `src/auth` **no se toca** |
| H0 | Piezas comunes: `DomainError`, contrato de error §7.5, paginación común, `RELOJ`, `@Actor()`, unidad de trabajo | `src/common/*`, `src/auth/decoradores` |
| C0–C5 | Todos los módulos de `src/modules` conformes al estándar | 17 módulos, ver abajo |

Módulos hexagonales conformes en `src/modules/` (usa estos como **plantilla**):

| Módulo | Sirve de ejemplo para |
|---|---|
| `cliente-instalacion`, `cliente-desinstalacion` | Módulo de negocio completo: repo + query separados, read models, presenters, `@Roles` (oficina decide, técnico ejecuta), unidad de trabajo, fakes y specs (127 / 85 pruebas) |
| `pppoe-automatizacion` | Efectos remotos (step runner §5.6), fachadas de otros módulos, recuperación |
| `pppoe-cliente-cuenta` | Entidad con transiciones de estado |
| `real-time-location` | Puerto de transacción de intención (`application/ports/<modulo>-transaction.port.ts`), cron delgado con `RELOJ`, policies de métricas |
| `ticket-soporte-historial` | Fachada consumida por un módulo **legacy** (`tickets-soporte`) dentro de su transacción (`PrismaTransaccional.unirseA`, transitorio) |
| `ticket-soporte-conformidad` | Compensación de efectos (subida de archivo + rollback), traducción de `P2002` a `CONFLICTO` |
| `almacenamiento-media`, `mikrotik-ssh`, `pppoe-credentials`, `mikrotik-router-credentials` | Capacidades técnicas publicadas como puerto en `public/` |

Fuera del refactor de módulos: `excel-reports` y `reports` (se resuelven en el módulo `reporte`, §3).

### 2.2 Piezas comunes que debes usar (no reinventar)

| Pieza | Ruta | Uso |
|---|---|---|
| `DomainError` | `src/common/hexagonal/domain-error.ts` | Base de todo error de negocio (`codigo`, `tipo`) |
| Paginación | `src/common/hexagonal/paginacion.ts`, `src/common/http/paginacion-query.dto.ts` | `normalizarPaginacion`, `aDesplazamiento`, `crearResultadoPaginado`, `presentarPaginado`, `PaginacionQueryDto` |
| Transformaciones de query | `src/common/http/transformaciones-query.ts` | `@ComoArreglo()`, `@ComoBooleano()`, `@Recortar()` |
| `Money` | `src/common/hexagonal/` | Montos (llegó en C4) |
| Reloj | `src/common/reloj/` | `RELOJ` (`ahora()`, `fechaOperativa()`), `RelojFijo` en pruebas |
| Unidad de trabajo | `src/common/transaccion/` | `UNIDAD_DE_TRABAJO.ejecutar(...)`; repos leen `PrismaTransaccional.cliente` (`private get db()`) |
| Actor | `src/auth/decoradores/actor.decorator.ts` | `@Actor() actor: ActorHttp` (usuarioId, empresaId, rol, nombre, sesionId, ip, userAgent) |
| Grupos de roles | `src/auth/roles/grupos-roles.ts` | `ROLES_OFICINA` (SUPER_ADMIN, ADMIN, COORDINADOR_OPERACIONES, OFICINA), `ROLES_TECNICO`; un grupo nuevo (p. ej. cobrador) se agrega **ahí** |
| Endpoint retirado | `src/common/endpoint-retirado/` | `@EndpointRetirado()` → 410 |
| Secreto interno | `src/common/secretos/` | `@RequiereSecretoInterno()` para integraciones públicas |
| Conformidad | `scripts/conformidad-hexagonal.sh <modulo>` | Checklist §12 del estándar (solo `src/modules/<modulo>`) |

### 2.3 Línea base medida

- `npm run build`: verde.
- `npm run lint:check`: **214** errores tras H1 (no subir; los archivos que toques quedan sin errores nuevos).
- Jest: 636/640; las suites de `src/common`, `src/auth/decoradores` y de todos los `src/modules/*`
  en verde. Fallan 4 suites boilerplate de `cloud-api-meta` y `location`.
- Correr un spec: `npm test -- src/modules/<modulo>` (1–2 min).

### 2.4 Deudas abiertas que dejaron las tandas anteriores

| Deuda | Se resuelve en |
|---|---|
| `PrismaTransaccional.unirseA(tx, …)` (puente para que `tickets-soporte` legacy use la fachada del historial dentro de su `$transaction`) | Refactor de `ticket-soporte`: se borra `unirseA` y su spec |
| `real-time-location` y otros emiten por `WebSocketServices` legacy (`src/web-sockets`) | Paso `common/tiempo-real` |
| `pppoe-automatizacion` lee el router con puertos internos de `src/mikro-tik` | `mikrotik-router` |
| Puerto `CLIENTE_INTERNET_ESTADO_OPERATIVO` vive en `pppoe-automatizacion/application/ports` (lo implementa algo que escribe en `ClienteInternet`) | H3 (`cliente`): pasa a ser fachada del módulo `cliente` |
| Los `Input` públicos de prealta/provisionamiento PPPoE aún llevan `empresaId` | Cuando se toquen; `empresaId` no es filtro (una empresa por BD) |
| `ClienteDesinstalacionEntity` ~950 líneas; varios use cases de C3 > 300 líneas | Opcional, cuando se toquen |
| Enum viejo comentado en `pppoe-cliente-cuenta/domain/enums/estado-cuenta-pppoe.enum.ts` | Cualquier commit de limpieza |
| Tabla `TicketConformidadEnlace` sin uso (flujo de enlace público retirado); env `TICKET_CONFORMIDAD_LINK_TTL_MINUTES` ya no se lee | Flujo nuevo de firma en el teléfono del técnico (lo define el dueño). **No** se borra la tabla (migraciones solo aditivas) |
| Roles de `real-time-location` (técnico: start/me/location/finish; oficina: mapa, historial, jornada, recorrido) aplicados por convención | El dueño puede ajustarlos |

---

## 3. Plan acordado y destino de cada carpeta legacy

Decisiones del dueño del **26-nov-2026**. Los nombres nuevos siguen §15 del estándar.

### 3.1 Decisiones

- **El servidor manda en el contrato.** La UI nueva es Angular y se construye alrededor del
  servidor: al refactorizar se mejora el contrato sin atarse al React actual (cada cambio se sigue
  anotando en `cambios-contrato-ui.md` para quien construya Angular).
- **Saldo del cliente:** no es un registro que se suba o baje; sale de calcular sus facturas
  pendientes y pagadas. La tabla `SaldoCliente` debe dejar de usarse (se queda en la base).
- **Permisos:** por ahora las rutas quedan abiertas a cualquier usuario con sesión; el dueño definirá
  quién puede crear o eliminar. Oficina también puede eliminar.
- **No se migran, se borran** (paso 0): `customer-payload`, `broadcast`, `olt`, `perfil-usuario`,
  `metricas-tickets`, `open-ia`, `fireworks-ia` (no hay asistente IA), `twilio`, `twilio-api`,
  `twilio-mensajes` (Twilio ya no se usa), `mensaje`, `notificaciones-usuario`,
  `banrural-integration` (nunca se implementó), `network-service` y `ssh-mikrotik-connection`.
- **MikroTik:** nada fuera de los módulos `pppoe-*` se usa. De `customer-network-config` queda solo el
  guardado de la IP (base de datos) hasta pasarlo a `cliente`. `mikro-tik` se queda porque PPPoE lo
  consume.
- **Las tablas y sus datos se quedan** (migraciones solo aditivas).
- **Fusiones:** pagos dentro de `facturacion` (no hay módulo `pago`), `factura-eliminacion` en
  `facturacion`, `id-contrato` en `contrato-cliente`, `sector` en `ubicacion`. Otras solo cuando el
  dominio lo pida.
- **Estados del cliente:** `estadoCliente` depende de su PPPoE y del ajuste manual; facturas y pagos
  no lo cambian. `estadoCobranza` sale solo de las facturas.
- **Los crons van al final** y tendrán un tratamiento especial que definirá el dueño. Hasta entonces
  no se toca su comportamiento (tampoco el de `credito`).
- **Reportes** no se migra hasta nuevo aviso.
- **Tickets:** a futuro habrá comentarios con imágenes, borrado de comentarios, etc.; el comentario
  se modela como pieza propia de `ticket-soporte`.

### 3.2 Orden de trabajo

En nombres, fusiones y alcance esta tabla manda sobre la propuesta de §15.1 del estándar.

| # | Paso / destino | Legacy | Estado | Notas |
|---|---|---|---|---|
| 0 | Limpieza | Las carpetas de §3.1 | ✅ Hecho | `refactorizacion limpieza #1–#7` y `dependencias #1` |
| 1 | **H1** saneamiento (sin crons) | `facturacion`, `cliente-internet`, `dashboard` | ✅ Hecho | `facturacion #1–#2`, `cliente-internet #1–#3`, `dashboard #1` (§6.1) |
| 2 | **H2** roles | API legacy que quede | En espera | El dueño definirá los permisos (§3.1). No agregar restricciones sin su mapa |
| 3 | Ubicación de técnicos → `real-time-location` | `real-time-location` legacy | **Siguiente** | `GET /real-time/last-locations` conserva la ruta (alimenta el dashboard de admin) |
| 4 | `cliente` (H3) | `cliente-internet`, `customer-network-config` | Pendiente | Revisar `src/cliente-internet/domain/`. Fachada `CLIENTE` |
| 5 | `zona-facturacion` (H5) | `facturacion-zona` | Pendiente | `modoCorte`, días 1–31, `@Roles` |
| 6 | `facturacion` | `facturacion`, `factura-eliminacion` | Pendiente | Incluye los pagos |
| 7 | `mensajeria-cliente` (H6) | `whatsapp-template`, `cloud-api-meta`, `whatsapp-api-meta`, `whatsapp-campaigns` | Pendiente | Meta como adaptador. **Nunca** enviar mensajes en pruebas |
| 8 | `ruta-cobro` | `ruta-cobro` | Pendiente | Registra pagos por la fachada de `facturacion` |
| 9 | `credito` | `credito` | Pendiente | Ya parcialmente hexagonal. Su cron no cambia de comportamiento |
| 10 | `mikrotik-router` | `mikro-tik` | Pendiente | Quita la deuda de `pppoe-automatizacion` |
| 11 | `ticket-soporte` | `tickets-soporte`, `ticket-resumen`, `ticket-seguimiento`, `ticket-soluciones`, `tags-ticket`, `bot-functions` | Pendiente | Al terminar se borra `unirseA`. Conservar `@RequiereSecretoInterno()` |
| 12 | `notificacion` | `notificaciones`, `push-notifications`, `push-dispositivos` | Pendiente | Migrar y mejorar. Push = efecto real |
| 13 | `common/tiempo-real` | `web-sockets` | Pendiente | Incluye `POST /internal/server/broadcast` |
| 14 | `usuario` | `user`, `perfil` | Pendiente | Sin tocar `auth`; solo SUPER_ADMIN edita a otros |
| 15 | `contrato-cliente` | `contrato-cliente`, `id-contrato` | Pendiente | |
| 16 | `servicio` | `servicio`, `servicio-internet`, `tipo-servicio` | Pendiente | |
| 17 | `ubicacion` | `location`, `sector` | Pendiente | |
| 18 | `empresa` | `empresa` | Pendiente | |
| 19 | `ticket-soporte-metrica` | `metas-tickets` | Pendiente | |
| 20 | `dashboard` | `dashboard` | Pendiente | Solo lectura: puertos de consulta y read models |
| Final | `tareas-programadas` (H4), `cobranza` (H7–H10), `ciclo-facturacion` (H11) | `zona-facturacion-cron` y nuevos | Pendiente | Incluye los días 29–31 y la limpieza de sesiones vencidas (G6). El diseño de cobranza está en la guía del dueño |
| Aplazado | `reporte` | `generate-reports`, `modules/excel-reports`, `modules/reports` | Aplazado | |

Transversal: `Utils`, `shared` y `CustomDecoratorAuthToken` se absorben en `common/` o en el módulo
que los use; `migrate.module.ts` y `migrate.service.ts` se revisan y se preguntan. Estado final de
`src/`: `main.ts`, `app.module.ts`, `auth/`, `common/`, `prisma/`, `swagger/`, `modules/`.

Deuda medida en los más grandes (para dimensionar):

| Legacy | `new Date()` | `throw …Exception` HTTP | `console.*` | `@Roles` | `$transaction` |
|---|---|---|---|---|---|
| `facturacion` | 6 | 27 | 22 | 0 | 9 |
| `credito` | 17 | 18 | 0 | 0 | 7 |
| `tickets-soporte` | 8 | 24 | 1 | 0 | 5 |
| `cliente-internet` | 2 | 6 | 12 | 0 | 7 |
| `mikro-tik` | 6 | 18 | 0 | 0 | 0 |
| `zona-facturacion-cron` | 0 | 11 | 0 | 0 | 0 |
| `ruta-cobro` | 0 | 10 | 6 | 0 | 2 |
| `dashboard` | 2 | 9 | 5 | 0 | 0 |

---

## 4. Cómo se refactoriza un módulo legacy (receta)

### 4.1 Antes de escribir código (se presenta al dueño)

1. **Inventario de rutas:** `grep -rn "@Get\|@Post\|@Put\|@Patch\|@Delete" src/<legacy>`. Para cada
   ruta: método, ruta, DTO, qué devuelve, quién la usa (front React, Angular, Android, bot, banco).
2. **Consumidores internos:** quién importa el módulo o su service
   (`grep -rn "from 'src/<legacy>" src`, `grep -rn "<Legacy>Service" src`). Cada consumidor tendrá
   que pasar a la fachada `public/` del módulo nuevo.
3. **Crons y efectos:** `@Cron`, envíos (Meta/Twilio/push), SSH. Cada efecto real va por un puerto
   y se prueba con fakes.
4. **Tablas que escribe:** las propias quedan en su repositorio; las de otro módulo se escriben solo
   por la fachada de ese módulo (si aún es legacy, se deja un puerto de aplicación con un adaptador
   transitorio en `infra/` y se documenta como deuda).
5. **Bugs y comportamientos raros** encontrados (§6) con archivo y línea.
6. **Propuesta**: nombre del módulo, cambios de ruta (solo si la legacy es mala: verbos, `delete-all`,
   nombres confusos), roles por ruta, cambios de contrato. Preguntas abiertas.

### 4.2 Mapeo de carpetas legacy → árbol canónico

| Lo que encuentras en el legacy | A dónde va |
|---|---|
| `<x>.service.ts` con CRUD y Prisma | Un `application/use-cases/<verbo>-<sustantivo>.use-case.ts` por acción + `infra/prisma/*.repository.ts` / `*.query.ts` |
| `<x>.controller.ts` | `presentation/http/<recurso>.controller.ts` (delgado: actor → `execute` → presenter) |
| `dto/`, `query/`, `pagination/*.dto.ts` | `presentation/dto/` (`<accion>-<recurso>.dto.ts`, `listar-<recurso>-query.dto.ts extends PaginacionQueryDto`) |
| `entities/` del CLI (clases vacías o calco de Prisma) | Se borran. La entidad real es `domain/entities/<x>.entity.ts` (`create`/`hydrate`/`toPrimitives`) |
| `select/` (objetos `select` de Prisma) | Dentro del `infra/prisma/*.query.ts` que los usa |
| `common/mappers.ts`, `mappers/` | `infra/prisma/<recurso>-prisma.mapper.ts` (Prisma ↔ dominio) y `presentation/presenters/` (dominio → UI) |
| `helper/`, `helpers/`, `functions/`, `utils/`, `utilities/` | Reglas puras → `domain/policies/<nombre>.policy.ts`; orquestación compartida por ≥ 2 use cases → `application/services/`; técnico → `infra/<tecnologia>/` |
| `interfaces/`, `types/` | `domain/read-models/`, `props/`, o el `.port.ts` que los usa |
| `infraestructure/` | `infra/` |
| `app/` | `application/use-cases/` |
| `*-cron.service.ts` | `presentation/cron/<nombre>.cron.ts` (solo decide cuándo) + use case |
| Constantes `TZ`, `dayjs()` sueltos | `RELOJ` en aplicación; `dayjs` solo en `infra/` o en el adaptador del reloj |
| Emisión de sockets con `WebSocketServices` | Puerto `application/ports/<x>-realtime.port.ts` + adaptador `infra/websocket/` |

Lo prohibido por el estándar (`tokens/`, `application/dto`, `common/` en el módulo, `helpers/`,
`utils/`, carpetas vacías, `ppoe`) **no se copia** al módulo nuevo.

### 4.3 Escribir el módulo

- Árbol, nombres, entidades, puertos, use cases, presenters y módulo Nest: **exactamente** como el
  estándar §2–§9. Copia la forma de `cliente-instalacion` o del módulo de §2.1 más parecido.
- Enums de dominio propios (`domain/enums`); conversión Prisma ↔ dominio solo en el mapper.
- Errores: un archivo `domain/errors/<modulo>.errors.ts`; `codigo` estable `UPPER_SNAKE` con prefijo
  del módulo; `message` en español, sin ids internos. Cada subclase con `constructor() { super('…') }`
  público.
- Repositorios que escriben: `constructor(private readonly transaccional: PrismaTransaccional)` y
  `private get db() { return this.transaccional.cliente; }` para unirse a la unidad de trabajo.
- Escrituras atómicas de tablas propias → puerto de intención `<modulo>-transaction.port.ts`; de
  varios módulos → `UNIDAD_DE_TRABAJO` + fachadas. Dentro de una transacción no hay I/O remoto.
- Concurrencia: `updateMany` con condición de estado y `CONFLICTO` si afectó 0 filas. `P2002` →
  `CONFLICTO`, `P2025` → `NO_ENCONTRADO` en el adaptador.
- Listados: `findMany` + `count` en la misma `$transaction`; `sortBy` es enum con mapa a `orderBy`;
  `desde`/`hasta` `YYYY-MM-DD` como días completos de Guatemala.
- Controladores: sin `@UseGuards(JwtAuthGuard)`, sin `ValidationPipe`, sin `try/catch`, sin leer
  `x-forwarded-for`. `@Roles` en **cada** ruta (GET de lectura también si el dato es sensible).
- Logs: `new Logger(Clase.name)`, solo ids, códigos y duraciones. Fuera `console.log`.

### 4.4 Cortar el legacy (strangler)

1. Las rutas nuevas sustituyen a las legacy **con la misma ruta** salvo cambio aprobado. Cuidado con
   dos controladores registrando la misma ruta: al montar el nuevo, quita la ruta del viejo en el
   mismo commit.
2. Los consumidores internos pasan a la fachada (`@Inject(<MODULO>)` desde `public/`).
3. Cuando el legacy queda sin rutas ni consumidores: borrar la carpeta, quitarlo de `app.module.ts`
   y borrar sus specs boilerplate.

### 4.5 Verificación (todo esto antes de cada commit de código)

```bash
npm run build
npm run lint:check                                # sin superar §2.3 y 0 errores nuevos en archivos tocados
npm test -- src/modules/<modulo>                  # specs del módulo en verde
bash scripts/conformidad-hexagonal.sh <modulo>    # vacío (falsos positivos se justifican en el commit)
```

Para corregir formato **solo** en archivos tocados: `npx eslint --fix <archivos>` (nunca `npm run lint`).

**Humo con la app** (solo si hace falta y con estas reglas):
- Hora de Guatemala primero: `node -e "console.log(new Date().toLocaleString('es-GT',{timeZone:'America/Guatemala'}))"`
  (Git Bash da UTC). **No** arrancar cerca de las horas pares (`0 */2 * * *`), 01:00 ni 10:00 GT: hay
  crons reales que generan facturas y mandan WhatsApp.
- `.env` local apunta a **producción**: nunca leas su contenido, nunca ejecutes rutas que escriban,
  manden mensajes o toquen MikroTik. El humo típico es: rutas sin token → 401, rutas retiradas → 404,
  y GETs de lectura.
- Al terminar, matar node por PID (PowerShell `Get-CimInstance Win32_Process` filtrando
  `SERVER_CRM_NOVA|dist.src.main`) y verificar que queden 0 procesos. `TaskStop` deja node vivo.

### 4.6 Commit, docs e informe

- Rama `refactorizaciones-hexagonales`. Commit `refactorizacion <modulo-nuevo> #N — <qué>`, un
  propósito por commit (p. ej. `#1` módulo al estándar, `#2` specs, `#3` retiro del legacy). Los
  cambios a `src/common` van como `refactorizacion comun #N` (el último es `#9`); los de docs como
  `refactorizacion docs #N` (el último es `#12`, esta guía).
- El mensaje de commit incluye lo verificado (build, lint antes → después, pruebas N/N, conformidad)
  y termina con la línea `Co-Authored-By:` que indique el sistema.
- En el **mismo commit**: `docs/cambios-contrato-ui.md` (cada cambio visible: ruta, campo, forma,
  código de error, 403 nuevo), siguiendo el formato de las filas que ya existen.
- Al cerrar un paso: actualizar la tabla de §3 de esta guía (Estado), `CLAUDE.md` (lista de etapas y
  línea base de lint) y §13.1 del estándar si aplica, en un `refactorizacion docs #N`.
- `git push origin refactorizaciones-hexagonales`. **Nunca** `main`. El punto de control
  `checkpoints-refactorizaciones` se mueve solo cuando el dueño lo pide (avance rápido:
  `git push origin <sha>:refs/heads/checkpoints-refactorizaciones`, sin `--force`).
- **Informe corto al final de cada ronda:** qué se hizo, verificación (build, lint, pruebas, humo),
  desviaciones o supuestos tomados sin preguntar, deudas que quedan, y la pregunta para el siguiente
  paso.

---

## 5. Reglas que no se negocian (resumen operativo)

- No instalar dependencias sin preguntar. `npm ci`, nunca `npm install`.
- Migraciones solo aditivas (`CREATE TABLE/INDEX`, `ADD COLUMN` nullable o con `DEFAULT`). Nunca
  `migrate dev`, `migrate reset` ni `db push`. Una columna o tabla que deja de usarse **se queda**.
- Nunca registrar ni devolver secretos, contraseñas, secretos PPPoE, tokens, DPI, teléfonos ni
  correos que la pantalla no necesite.
- No cambiar el formato de contraseña PPPoE (convención `NV-…` con fecha de Guatemala).
- Cambiar una **ruta** = proponerla antes al dueño. Cambiar una regla del estándar = commit propio
  con autorización.
- `auth`, la lógica de cálculo de facturas (fuera de H1) y promesas de pago: fuera de alcance salvo
  pedido explícito.
- Ante una decisión que cambia comportamiento y no está escrita: **preguntar**.

---

## 6. Bugs y comportamientos raros conocidos (a corregir en su paso)

### 6.1 H1 — Saneamiento de estados

Contexto que hay que entender primero (verificado en `prisma/schema.prisma`):

- `ClienteInternet.estadoCliente` (`EstadoCliente`) es el **estado operativo**: `ACTIVO`, `SUSPENDIDO`,
  `DESINSTALADO`, `PENDIENTE_ACTIVO`, `EN_INSTALACION`. Lo definen PPPoE y el ajuste manual. Los
  valores `PAGO_PENDIENTE`, `ATRASADO` y `MOROSO` del mismo enum están marcados `// NO USAR`.
- `ClienteInternet.estadoCobranza` (`EstadoCobranzaCliente`: `AL_DIA`, `PAGO_PENDIENTE`, `ATRASADO`,
  `MOROSO`) es la **cobranza**; se recalcula con
  `FacturacionService.recalcularClienteDespuesDeCambioFactura` y `getEstadoCobranza`.
- El filtro de facturables de los crons exige `estadoCliente: ACTIVO`: si una factura o un pago escribe
  otro valor, ese cliente **deja de facturarse**. Ocurre en producción y los usuarios lo reportaron.
  Los clientes ya afectados se revisan **después** de refactorizar.

**Estado: corregido** (26-nov-2026), con pruebas junto a cada archivo. La tabla queda como registro.

| # | Dónde | Bug | Corrección (aprobada) |
|---|---|---|---|
| 1 | `facturacion.service.ts` `updateFactura` | Escribe `estadoCliente`, no recalcula cobranza, no usa transacción y su `catch` devuelve éxito vacío | Una transacción; recalcular `estadoCobranza`; no tocar `estadoCliente`; los errores salen |
| 2 | `facturacion.service.ts` `deleteOnePayment` | Escribe `estadoCliente` y no recalcula cobranza | Igual que #1 |
| 3 | `cliente-internet.service.ts` alta | Crea la primera factura sin recalcular `estadoCobranza` | Recalcular |
| 4 | `cliente-internet.service.ts` `updateClienteInternet` | Si no llegan, pone `ACTIVO` y `AL_DIA`; reemplaza `desinstaladoEn` en cada edición | No escribir lo que no llega; `estadoCobranza` se ignora (sale de las facturas); conservar la fecha |
| 5 | `CreateClienteInternetDto`, `UpdateClienteInternetDto` | **Bloquea el deploy:** validadores imposibles, alta y edición responden 400 con el pipe estricto | Ajustar al payload real del React, con spec |
| 6 | `findCustomersToTable` | Contadores de cobranza leen `estadoCliente` | Leer `estadoCobranza` (anotar) |
| 7 | `dashboard.service.ts` `getDashboardData` | Morosos y atrasados leen `estadoCliente` | Leer `estadoCobranza`, sin desinstalados (anotar) |

La corrección de los días 29–31 (`shouldSkipZoneToday`) **no** va en H1: se hace con los crons.

H1 es saneamiento en sitio: commits `refactorizacion facturacion #N`, `refactorizacion cliente-internet #N`,
`refactorizacion dashboard #N`, uno por propósito, con pruebas de que facturas y pagos no cambian
`estadoCliente`.

### 6.2 Otros

| Dónde | Problema | Paso |
|---|---|---|
| `modules/cliente-desinstalacion` | Completar una desinstalación **no** marca al cliente `DESINSTALADO` ni `desinstaladoEn` (ningún archivo de `src/modules` lo escribe) | `cliente`, con su fachada |
| Toda la API legacy | Sin `@Roles` (G1): cualquier usuario autenticado, técnico incluido, borra pagos, edita facturas y zonas | H2 |
| Sesiones, refresh e intentos de auth | Nadie los limpia (G6) | `tareas-programadas` |
| `src/real-time-location` legacy | Montado vía `LocationModule`; su `GET last-locations` alimenta el dashboard y su `POST update-location` es el único que emite `emit:location:real-time` | Paso 3 |
| `SaldoCliente` | `facturacion` aún la escribe y `cliente-internet` (detalle y listados) y `ruta-cobro` aún la **leen**. Los crons no la actualizan, así que esos saldos quedan atrasados. `facturacion #3` la recalcula desde las facturas al editar o eliminar pagos | `facturacion`, `cliente` y `ruta-cobro`: calcular al leer y dejar de escribirla |
| `facturacion` `delete-one-factura` | El usuario que elimina llega en el body (`userId`) en vez de salir de la sesión | Módulo `facturacion` |
| `generate-reports` `QueryCobranzaReport` | Fechas con `@IsDate` sin conversión: probable 400 con el pipe estricto (sin probar) | Antes del deploy |
| Legacy en general | `throw new BadRequestException(...)` en services, `console.log` con datos, `new Date()` en UTC para fechas de negocio, métodos con `tx?: Prisma.TransactionClient` opcional (escrituras que a veces son atómicas y a veces no), `findMany` sin `count` en la misma transacción | Cada módulo al refactorizarse |
| Cálculo de fechas | `dayjs().tz(...)` disperso y constantes `TZ` locales | Usar `RELOJ` |

Al refactorizar, busca además: escrituras en dos tablas sin transacción, actualizaciones que pisan
campos no enviados (`dto.x || valorPorDefecto`), `include` que devuelven el registro Prisma completo
a la UI (fugas de campos), y `catch` que tragan errores y devuelven `200`.

---

## 7. Decisiones abiertas del dueño (preguntar al empezar el paso que las necesita)

| # | Pregunta | Paso | Recomendación |
|---|---|---|---|
| 1 | Mapa de roles por módulo (SUPER_ADMIN, ADMIN, COORDINADOR_OPERACIONES, OFICINA, TIENDA, TECNICO, COBRADOR) | H2, en espera | Lo define el dueño |
| 2 | ¿El dominio inicial de `src/cliente-internet/domain/` se aprovecha tal cual? | `cliente` | Llevarlo a `src/modules/cliente/domain/` y ajustarlo al estándar |
| 3 | ¿La app Android envía su ubicación a `real-time/update-location` o a `real-time-location/tracking/location`? El dueño cree que a la nueva (26-nov-2026) | Paso 3 | Antes de retirar la vieja, buscar quién más la usa y confirmarlo |
| 4 | Nombres finales de cada módulo (§3.2) | Cada paso | Los de §3.2 |
| 5 | ¿La etapa auth ya se desplegó? Si no, cada paso se acumula sobre un deploy grande | Siempre que aplique | |
| 6 | ¿Se quita `SaldoCliente` ahora o al refactorizar `cliente` y `ruta-cobro`? | `cliente` | Al refactorizar, calculando el saldo al leer |

---

## 8. Lecciones aprendidas (evitan horas)

- **El build no detecta dependencias de Nest rotas.** Tras mover o borrar módulos, resuelve `AppModule`
  con `Test.createTestingModule({ imports: [AppModule] }).compile()` desde un script temporal en una
  carpeta **sin `.env`**, con `DATABASE_URL` apuntando a `127.0.0.1` y secretos ficticios (`JWT_SECRET`,
  `MIKROTIK_SECRET_KEY`). Sin `init()`: no arrancan crons ni conexiones.
- **Hay DTO legacy que el pipe estricto rechaza.** Al tocar un módulo, pasa por `ValidacionGlobalPipe`
  el cuerpo que envía su cliente y deja un spec (ver `cliente-internet/dto`).
- **Fakes que devuelven copias**: un repositorio falso debe devolver `Entidad.hydrate(e.toPrimitives())`
  en cada lectura; si devuelve la misma instancia, los tests de concurrencia pasan en falso o fallan raro.
- Use cases se instancian con `new` y `RelojFijo`; sin `TestingModule`.
- Los archivos con tildes o comillas se escriben con la herramienta Write, no con heredocs de bash
  (fallan con "unexpected EOF"). En Windows no hay `python`: usa `node` para scripts auxiliares.
- `git reset` antes de `git add` puede des-preparar borrados (`git rm`): revisa `git status` antes de
  cada commit.
- Al mover archivos quedan carpetas vacías que el script de conformidad marca:
  `find src/modules/<m> -type d -empty -delete`.
- El script de conformidad marca como falso positivo un enum con el valor `'TECNICO'` (check 13); se
  acepta y se menciona en el commit.
- Un módulo legacy que consume una fachada dentro de su propio `prisma.$transaction` usa
  `PrismaTransaccional.unirseA(tx, () => fachada.metodo(...))` (transitorio; no lo uses en código
  hexagonal nuevo).
- Entidades: validaciones que antes eran `Error` genérico daban 500; como `DomainError` `INVALIDO`
  dan 400. Es un cambio de contrato y se anota.
- Si un script de `scripts/` deja de compilar porque arma el módulo a mano, se borra (queda en git)
  y se documenta en el commit.

---

## 9. Prompt para el siguiente chat

Copia esto como primer mensaje de un chat nuevo de Claude Code en este proyecto:

```
Continuamos el refactor hexagonal de CRM NOVA. Haz `git fetch origin && git pull --ff-only` en
refactorizaciones-hexagonales y lee CLAUDE.md, docs/estandar-hexagonal-crm-nova.md y
docs/guia-fase-legacy-crm-nova.md completos. Mide la línea base (build y lint:check). Luego toma el
siguiente paso pendiente de la tabla §3.2 de la guía y preséntame su inventario (§4.1), los bugs que
encontraste, la propuesta de nombres/rutas/roles y las preguntas abiertas de §7. No cambies código
hasta que yo confirme.
```
