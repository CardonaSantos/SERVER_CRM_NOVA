# CRM NOVA (servidor) — Guía de la fase legacy (H1–H12 y resto de `src/`)

> **Para quién es:** para cada chat nuevo de Claude Code que siga el refactor, y para el dueño.
> Este documento reemplaza el contexto de conversaciones anteriores: si lo lees completo junto con
> `CLAUDE.md` y `docs/estandar-hexagonal-crm-nova.md`, tienes todo lo necesario para continuar.
>
> | Dato | Valor |
> |---|---|
> | Fecha | 26-nov-2026 |
> | Rama de trabajo | `refactorizaciones-hexagonales` en `ee2b197` (+ el commit que agrega esta guía) |
> | Punto de control | `checkpoints-refactorizaciones` en `ee2b197` |
> | Producción (`main`) | `108c6ef`: **nada de este trabajo está desplegado** |
> | Prioridad de documentos | 1) `estandar-hexagonal-crm-nova.md` (forma de todo módulo) · 2) esta guía (qué sigue y cómo) · 3) `guia-post-auth-refactor-hexagonal-crm-nova.md` (historia de auth, §8.4 orden original) |

---

## 0. Cómo arrancar un chat nuevo (léelo primero)

1. `git fetch origin && git checkout refactorizaciones-hexagonales && git pull --ff-only`
   (el dueño trabaja desde dos máquinas).
2. Lee `CLAUDE.md`, `docs/estandar-hexagonal-crm-nova.md` y **esta guía**. No hace falta leer la
   guía post-auth completa salvo que necesites detalles de auth.
3. Mira §3 (tabla de pasos) para saber cuál es el **siguiente paso pendiente**. La columna Estado se
   actualiza al cerrar cada paso.
4. **No empieces a cambiar código hasta que el dueño diga que se empieza ese paso.** Primero
   presenta: inventario del módulo (rutas, crons, consumidores), propuesta de nombres y rutas,
   bugs detectados, y las preguntas abiertas del paso (§7). Espera su respuesta.
5. Línea base antes de tocar nada: `npm run build` (verde) y `npm run lint:check` (≤ 321 errores).
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
- `npm run lint:check`: **321** errores (no subir; los archivos que toques quedan sin errores nuevos).
- Jest: suites de `src/common`, `src/auth/decoradores` y de todos los `src/modules/*` en verde; 11
  suites legacy son boilerplate roto del CLI (se borran cuando se borra su módulo).
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

## 3. Inventario legacy y destino

Líneas de TypeScript sin specs, medidas en `ee2b197`. "Ctrl" = archivos con `@Controller`.
Los nombres nuevos siguen §15 del estándar y **se confirman con el dueño al empezar cada paso**.

### 3.1 Camino crítico (en este orden)

| Paso | Legacy | Destino | Líneas | Estado | Qué incluye |
|---|---|---|---|---|---|
| **H1** | `facturacion`, `cliente-internet`, `zona-facturacion-cron`, `dashboard` (solo lecturas de estado) | (sin módulo nuevo: saneamiento en sitio) | — | **Siguiente** | §6.1. No es hexagonal: corrige estados y el día de zona. Va primero porque cambia quién es facturable |
| **H2** | Controladores legacy de `facturacion`, `facturacion-zona`, `banrural-integration`, `ruta-cobro`, `ssh-mikrotik-connection`, `factura-eliminacion` | (en sitio) | — | Pendiente | `@Roles` en la API existente, un commit por módulo, 403 nuevos anotados en `cambios-contrato-ui.md`. Necesita el mapa de roles del dueño (§7) |
| **H3** | `cliente-internet` (3 672) | `cliente` | 3 672 | Pendiente | Ya hay dominio inicial sin conectar en `src/cliente-internet/domain/` (entidad, props, enum, puerto): **revisarlo y llevarlo** a `src/modules/cliente/domain/`, no reescribir desde cero. Fachada `CLIENTE` para que `cliente-desinstalacion` marque `DESINSTALADO` y para reemplazar `CLIENTE_INTERNET_ESTADO_OPERATIVO` |
| **H4** | (nuevo) | `tareas-programadas` | — | Pendiente | Candado Postgres (`pg_try_advisory_lock`) + registro de ejecuciones para crons; `FechaOperativa`/calendario. Primer consumidor: limpieza de sesiones/refresh/intentos vencidos (G6) |
| **H5** | `facturacion-zona` (445) | `zona-facturacion` | 445 | Pendiente | `modoCorte`, validaciones de días (1–31 con clamp), `@Roles(ROLES_OFICINA)` en escrituras |
| **H6** | `whatsapp-template`, `cloud-api-meta`, `whatsapp-api-meta`, `whatsapp-campaigns`, `twilio`, `twilio-api`, `twilio-mensajes`, `mensaje`, `broadcast` | `mensajeria-cliente` | ~2 500 | Pendiente | Outbox + despachador; Meta y Twilio como adaptadores `infra/meta`, `infra/twilio`. **Nunca** enviar mensajes en pruebas |
| **H7–H10** | (nuevo) | `cobranza` | — | Pendiente | Evaluación y lotes simulados → ejecución del corte (`@OperacionSensible`) → reconciliación → salida por fases. Diseño funcional en la guía de cobranza del dueño (no está en el repo: pídela si hace falta) |
| **H11** | `zona-facturacion-cron` (1 240, 4 crons `0 10 * * *` GT) | `ciclo-facturacion` | 1 240 | Pendiente | Un cron delgado por etapa sobre casos de uso; usa `tareas-programadas` |
| **H12** | `banrural-integration` (475) + pagos de `facturacion` y `ruta-cobro` | `pago` | ~1 500 | Pendiente | Banrural es un adaptador. **Confirmar G4** (quién llama a Banrural) antes de tocar auth de esas rutas |
| — | `facturacion` (2 569), `factura-eliminacion` (255) | `facturacion` | 2 824 | Pendiente | Después de H12 o junto a él, según decida el dueño |

### 3.2 Resto (fuera del camino crítico, orden sugerido por riesgo/tamaño)

| Legacy | Destino | Líneas | Notas |
|---|---|---|---|
| `credito` (4 856, 8 ctrl, cron `0 1 * * *`) | `credito` | 4 856 | Ya parcialmente hexagonal (`credito-cron` con puerto). 17 `new Date()`, 9 `any` |
| `tickets-soporte` (4 336), `ticket-resumen`, `ticket-seguimiento`, `ticket-soluciones`, `tags-ticket`, `bot-functions` | `ticket-soporte` | ~6 000 | Al terminar se borra `unirseA`. `bot-functions` es público con `@RequiereSecretoInterno()`: conservar esa protección |
| `metas-tickets`, `metricas-tickets` | `ticket-soporte-metrica` | 762 | |
| `dashboard` (3 238) | `dashboard` | 3 238 | Solo lectura: sin `entities/`, solo puertos de consulta y read models |
| `generate-reports` + `modules/excel-reports` + `modules/reports` | `reporte` | ~17 000 | `reports` está casi vacío; `excel-reports` ya tiene forma hexagonal parcial |
| `mikro-tik`, `customer-network-config`, `network-service`, `olt` | `mikrotik-router` | 2 372 | Junto a `mikrotik-ssh`. Quita la deuda de `pppoe-automatizacion` |
| `ssh-mikrotik-connection` | — (retirar) | 879 | Corte legacy por IP (G3: recibe contraseña sin step-up). Se retira cuando todo esté en PPPoE; preguntar antes |
| `ruta-cobro` | `ruta-cobro` | 1 103 | Sus pagos van a `pago` (H12) |
| `web-sockets` | `src/common/tiempo-real` | 885 | Transversal. Incluye `POST /internal/server/broadcast` (público + secreto) |
| `contrato-cliente`, `id-contrato` | `contrato-cliente` | 835 | |
| `notificaciones`, `notificaciones-usuario`, `push-notifications`, `push-dispositivos` | `notificacion` | 2 073 | Push = efecto real: nunca enviar en pruebas |
| `user`, `perfil-usuario`, `perfil` | `usuario` | 2 295 | Sin tocar `auth`. `user` ya tiene 5 `@Roles`: conservar la regla "solo SUPER_ADMIN edita a otros" |
| `location` (617) + `real-time-location` legacy (493) | `ubicacion` / borrar | 1 110 | `src/real-time-location` (ruta `real-time`) sigue montado **a través de `LocationModule`**; es un duplicado viejo del módulo hexagonal (`real-time-location`). Inventariar consumidores y proponer al dueño borrarlo |
| `servicio`, `servicio-internet`, `tipo-servicio` | `servicio` | 649 | CRUD pequeño, buen calentamiento |
| `sector`, `empresa` | `sector`, `empresa` | 526 | CRUD pequeño |
| `customer-payload` | — (borrar) | 549 | Sus importaciones ya responden 410 |
| `open-ia`, `fireworks-ia` | `asistente-ia` | 220 | Baja prioridad |
| `Utils`, `shared`, `CustomDecoratorAuthToken` | absorber en `common/` o en el módulo que los use | 271 | `src/Utils/pagination.ts` y `src/shared/.../Pagination.ts` se retiran cuando no tengan usuarios |
| `migrate.module.ts`, `migrate.service.ts` (raíz de `src`) | revisar y preguntar | — | Estado final de `src/`: `main.ts`, `app.module.ts`, `auth/`, `common/`, `prisma/`, `swagger/`, `modules/` |

Deuda medida en los más grandes (para dimensionar):

| Legacy | `new Date()` | `throw …Exception` HTTP | `console.*` | `@Roles` | `$transaction` |
|---|---|---|---|---|---|
| `facturacion` | 6 | 27 | 22 | 0 | 9 |
| `credito` | 17 | 18 | 0 | 0 | 7 |
| `tickets-soporte` | 8 | 24 | 1 | 0 | 5 |
| `cliente-internet` | 2 | 6 | 12 | 0 | 7 |
| `mikro-tik` | 6 | 18 | 0 | 0 | 0 |
| `zona-facturacion-cron` | 0 | 11 | 0 | 0 | 0 |
| `banrural-integration` | 0 | 11 | 0 | 0 | 0 |
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
npm run lint:check                                # ≤ 321 y 0 errores nuevos en archivos tocados
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

### 6.1 H1 — Saneamiento de estados y día de zona

Contexto que hay que entender primero (verificado en `prisma/schema.prisma`):

- `ClienteInternet.estadoCliente` (`EstadoCliente`) es el **ciclo de vida**: `ACTIVO`, `SUSPENDIDO`,
  `DESINSTALADO`, `PENDIENTE_ACTIVO`, `EN_INSTALACION`. Los valores `PAGO_PENDIENTE`, `ATRASADO` y
  `MOROSO` del mismo enum están marcados `// NO USAR` (no se pueden quitar: migraciones aditivas).
- `ClienteInternet.estadoCobranza` (`EstadoCobranzaCliente`: `AL_DIA`, `PAGO_PENDIENTE`, `ATRASADO`,
  `MOROSO`) es la **cobranza**, y ya se recalcula con
  `FacturacionService.recalcularEstadoCobranzaCliente` (`src/facturacion/facturacion.service.ts` ~2108)
  y `getEstadoCobranza` (`src/zona-facturacion-cron/helpers/Functions.ts:63`).
- Los scripts `scripts/estado-cobranza-migration.ts` y `estado-cobranza-indepotente.ts` ya migraron los
  datos viejos de `estadoCliente` a `estadoCobranza`.
- El filtro de facturables de los crons (`zona-facturacion-cron/helpers/Functions.ts` ~20) exige
  `estadoCliente: ACTIVO`: si algo escribe `ATRASADO`/`MOROSO` en `estadoCliente`, ese cliente **deja
  de facturarse**. Por eso H1 va primero.

| # | Dónde | Bug | Corrección propuesta |
|---|---|---|---|
| 1 | `facturacion.service.ts` `updateFactura` (~1409, escribe ~1487–1510) | Al editar una factura recalcula y escribe `estadoCliente` = PENDIENTE_ACTIVO/ATRASADO/MOROSO (valores NO USAR) | Dejar de escribir `estadoCliente`; recalcular `estadoCobranza` con `recalcularEstadoCobranzaCliente` dentro de la misma transacción |
| 2 | `facturacion.service.ts` `generatePagoFromBanrural` (~1915, escribe ~1986) | Usa `calculateEstadoCliente` (`facturacion/functions/functions.ts:3`) y escribe `estadoCliente` | Igual que #1; `calculateEstadoCliente` queda sin uso y se borra |
| 3 | `facturacion.service.ts` `deleteOnePayment` (~1999, escribe ~2082–2098) | Igual que #1 | Igual que #1 |
| 4 | `cliente-internet.service.ts` `updateClienteInternet` (~2222; ~2276) | `estadoCliente: dto.estado \|\| 'ACTIVO'` y `estadoCobranza: dto.estadoCobranza \|\| 'AL_DIA'`: editar el teléfono de un cliente suspendido o moroso lo deja ACTIVO y AL_DIA | Si el DTO no trae el campo, no se escribe (`undefined`) |
| 5 | `cliente-internet.service.ts` `findCustomersToTable` (~1402; conteos ~1557–1576) | Los contadores de la tabla de clientes cuentan `PENDIENTE_ACTIVO`/`ATRASADO`/`MOROSO` leyendo `estadoCliente` | Contar la cobranza por `estadoCobranza` (cambio visible: anotar) |
| 6 | `dashboard.service.ts` ~1000, ~1074, ~1083, ~1096, ~1102 | Cuenta morosos/atrasados leyendo `estadoCliente`: tras #1–#5 esas cifras quedan congeladas | Leer `estadoCobranza` (cambio visible: anotar en `cambios-contrato-ui.md`) |
| 7 | `zona-facturacion-cron/helpers/Functions.ts:27` `shouldSkipZoneToday` | Compara el día configurado con el día de hoy: una zona con día 29–31 **no corre** en meses más cortos | Clamp: `Math.min(dia, díasDelMes)` como ya hace `calcularPeriodo` (mismo archivo). Spec de la función con fechas fijas |
| 8 | Otros lectores de `estadoCliente` con valores de cobranza | `generate-reports`, `ruta-cobro`, `network-service`, `ssh-mikrotik-connection/helpers/decideSwitch.ts`, `customer-payload`, `cliente-internet/helper/mikrotik-estado.helper.ts`, `select/` | Inventariarlos (`grep -rn "estadoCliente" src --include=*.ts \| grep -v src/modules`) y, si filtran por ATRASADO/MOROSO, proponer pasar a `estadoCobranza` |

H1 es saneamiento en sitio: commits `refactorizacion facturacion #1…`, `refactorizacion cliente-internet #1…`,
`refactorizacion zona-facturacion-cron #1`, `refactorizacion dashboard #1`, uno por propósito. Revisar
que los DTOs tocados sigan pasando el pipe estricto. **Confirmar con el dueño** la corrección de cada
fila antes de empezar (la #4 y la #6 cambian lo que ve la UI).

### 6.2 Otros

| Dónde | Problema | Paso |
|---|---|---|
| `modules/cliente-desinstalacion` | Completar una desinstalación **no** marca al cliente `DESINSTALADO` ni `desinstaladoEn` (ningún archivo de `src/modules` lo escribe) | H3, con la fachada de `cliente` |
| Toda la API legacy | Sin `@Roles` (G1): cualquier usuario autenticado, técnico incluido, borra pagos, edita facturas y zonas | H2 |
| `ssh-mikrotik-connection` `suspend-customer`/`activate-customer` | Reciben contraseña en el body sin `@OperacionSensible` ni límite de intentos (G3) | Retiro o H2 |
| `banrural-integration` | Exige JWT desde auth #6; si lo llama el banco directo, los pagos dejan de entrar al desplegar (G4) | Confirmar antes de H12 / deploy |
| Sesiones, refresh e intentos de auth | Nadie los limpia (G6) | H4 |
| `src/real-time-location` legacy | Sigue montado vía `LocationModule` (`src/location/location.module.ts:5`), duplicando el hexagonal | Paso `ubicacion` |
| Legacy en general | `throw new BadRequestException(...)` en services, `console.log` con datos, `new Date()` en UTC para fechas de negocio, métodos con `tx?: Prisma.TransactionClient` opcional (escrituras que a veces son atómicas y a veces no), `findMany` sin `count` en la misma transacción | Cada módulo al refactorizarse |
| Cálculo de fechas | `dayjs().tz(...)` disperso y constantes `TZ` locales | Usar `RELOJ` |

Al refactorizar, busca además: escrituras en dos tablas sin transacción, actualizaciones que pisan
campos no enviados (`dto.x || valorPorDefecto`), `include` que devuelven el registro Prisma completo
a la UI (fugas de campos), y `catch` que tragan errores y devuelven `200`.

---

## 7. Decisiones abiertas del dueño (preguntar al empezar el paso que las necesita)

| # | Pregunta | Paso | Recomendación |
|---|---|---|---|
| 1 | Confirmar las correcciones de §6.1 (sobre todo #4 y #6) | H1 | Sí: `estadoCliente` solo ciclo de vida, cobranza en `estadoCobranza` (el schema ya lo marca así) |
| 2 | Mapa de roles por módulo. `RolUsuario` = SUPER_ADMIN, ADMIN, COORDINADOR_OPERACIONES, OFICINA, TIENDA, TECNICO, COBRADOR; los grupos actuales no cubren TIENDA ni COBRADOR | H2 | Pagos/facturas/borrados y zonas → `ROLES_OFICINA` (o un grupo admin más estrecho); ruta de cobro → oficina + nuevo `ROLES_COBRADOR`; preguntar qué hace TIENDA |
| 3 | ¿El dominio inicial de `src/cliente-internet/domain/` se aprovecha tal cual? | H3 | Llevarlo a `src/modules/cliente/domain/` y ajustarlo al estándar |
| 4 | ¿Quién llama a `banrural-integration`? (G4) | H12 / deploy | |
| 5 | ¿Se retira `ssh-mikrotik-connection` o se le pone `@OperacionSensible`? (G3) | H2 | Retirar cuando todo esté en PPPoE |
| 6 | ¿Se borra `src/real-time-location` legacy (ruta `real-time`)? | `ubicacion` | Sí, si ningún front la usa |
| 7 | Nombres finales de cada módulo (§3) | Cada paso | Los de §15.1 del estándar |
| 8 | ¿La etapa auth ya se desplegó? Si no, cada paso se acumula sobre un deploy grande | Siempre que aplique | |

---

## 8. Lecciones aprendidas (evitan horas)

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
siguiente paso pendiente de la tabla §3.1 de la guía y preséntame su inventario (§4.1), los bugs que
encontraste, la propuesta de nombres/rutas/roles y las preguntas abiertas de §7. No cambies código
hasta que yo confirme.
```
