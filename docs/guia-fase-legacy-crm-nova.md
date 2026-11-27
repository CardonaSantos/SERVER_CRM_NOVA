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
| `cliente` | Fachada de escritura para otros módulos, borrado lógico, listas con filtros, saldo calculado en una policy y puertos transitorios hacia módulos legacy |
| `facturacion` | Dinero: bloqueo del cliente por operación, entidad que deriva saldo y estado de los pagos, bitácoras de lo eliminado y fachada consumida por `cliente` sin ciclos (`cliente-cobranza`) |
| `mensajeria-cliente` | Proveedor externo como adaptador (errores: rechazado, no disponible, sin confirmar), trabajo en segundo plano con registro por destino y reanudación, candado para "uno a la vez" |
| `ruta-cobro` | Totales calculados desde los pagos, bloqueo compartido para cobrar y exclusivo para modificar, fachada que valida dentro de la transacción de otro módulo, exportación a Excel como adaptador |
| `servicio` | Catálogo que nunca se borra físicamente: eliminar solo lo nunca usado, bloqueo de fila entre asignar y eliminar, fachada consumida por cinco módulos y cambio de precio con contraseña |
| `ubicacion` | Catálogo de solo lectura con carga repetible por SQL, y comprobación de coherencia entre referencias que solo mira lo que cambia |
| `real-time-location` | Puerto de transacción de intención (`application/ports/<modulo>-transaction.port.ts`), cron delgado con `RELOJ`, policies de métricas |
| `ticket-soporte` | Módulo grande de punta a punta: máquina de estados con acciones según quién actúa, lista por bandejas con contadores, línea de tiempo, adjuntos con compensación y adaptadores transitorios sobre servicios legacy |
| `ticket-soporte-historial` | Bitácora publicada como fachada que otro módulo llama dentro de su unidad de trabajo |
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
- `npm run lint:check`: **106** errores tras el paso 11 (no subir; los archivos que toques quedan sin errores nuevos).
- Jest: 1090/1090; todas las suites en verde.
- Correr un spec: `npm test -- src/modules/<modulo>` (1–2 min). Con la caché fría la suite completa
  puede pasar de 5 minutos: córrela en segundo plano.

### 2.4 Deudas abiertas que dejaron las tandas anteriores

| Deuda | Se resuelve en |
|---|---|
| `real-time-location` y otros emiten por `WebSocketServices` legacy (`src/web-sockets`) | Paso `common/tiempo-real` |
| `pppoe-automatizacion` lee el router con puertos internos de `src/mikro-tik` | `mikrotik-router` |
| `cliente` escribe el contrato (`CONTRATO_FISICO`) por un adaptador propio y usa el servicio de `credito` (`CLASIFICACION_CREDITO`) | `contrato-cliente` y `credito`: pasan a sus fachadas |
| Columnas `Ruta.montoCobrado` y tablas `CobroRuta`, `RutaTurno`, `FacturaRuta` sin escritura desde el paso 8 | Se quedan en la base |
| Migración `20261126230000_ruta_cobro_borrado_logico` (dos columnas opcionales en `Ruta` e índice en `PagoFacturaInternet.rutaId`), aplicada solo en local | **En el deploy**: `prisma migrate deploy` |
| `GET /user/get-users-to-rutas` devuelve todos los usuarios (también inactivos) y `apellidos` repite el nombre. El servidor ya rechaza asignar uno inactivo | `usuario` |
| `dashboard` lee las rutas abiertas directamente de la tabla (solo se le agregó `eliminadoEn: null`) | `dashboard` |
| Tabla `SaldoCliente` sin uso desde el paso 6 (nadie la escribe ni la lee) | Se queda en la base |
| Migración `20261126180000_zona_facturacion_borrado_logico` (dos columnas opcionales en `FacturacionZona`), aplicada solo en local | **En el deploy**: `prisma migrate deploy` antes de arrancar esta versión |
| Migración `20261126200000_facturacion_pagos_eliminados` (tabla `PagoEliminado` y dos columnas opcionales), aplicada solo en local | **En el deploy**: `prisma migrate deploy` |
| Los crons crean facturas y escriben `estadoCobranza` directamente en las tablas | `ciclo-facturacion`: por las fachadas de `facturacion` y `cliente-cobranza` |
| Los reportes deducen la ruta de un pago por `facturaRutaId`; los pagos nuevos la guardan en `rutaId` | `reporte` |
| Migración `20261126220000_campanias_mensaje` (tablas `CampaniaMensaje` y `EnvioCampaniaMensaje`), aplicada solo en local | **En el deploy**: `prisma migrate deploy` |
| Mensajería sin probar por HTTP ni contra Meta (solo proveedor falso y base local) | Antes del deploy: una campaña a un número propio |
| El webhook de Meta descarta los estados de entrega: `ENVIADO` es "aceptado por WhatsApp" | Si el dueño pide confirmar entregas |
| Crons y tickets envían uno por uno por `MENSAJERIA_CLIENTE` sin registrar el envío; `RecordatorioPago` no se escribe | `ciclo-facturacion` |
| En producción (`main`) plantillas y campañas no piden sesión; el React no envía token en esas pantallas y crea plantillas contra la URL del POS | Se cierra con el deploy; la UI nueva envía el token a la URL del CRM |
| Los crons leen `FacturacionZona` directamente (solo se les agregó `eliminadoEn: null`) | `ciclo-facturacion`: por la fachada de `zona-facturacion` |
| Los `Input` públicos de prealta/provisionamiento PPPoE aún llevan `empresaId` | Cuando se toquen; `empresaId` no es filtro (una empresa por BD) |
| `ClienteDesinstalacionEntity` ~950 líneas; varios use cases de C3 > 300 líneas | Opcional, cuando se toquen |
| Enum viejo comentado en `pppoe-cliente-cuenta/domain/enums/estado-cuenta-pppoe.enum.ts` | Cualquier commit de limpieza |
| Tabla `TicketConformidadEnlace` sin uso (flujo de enlace público retirado); env `TICKET_CONFORMIDAD_LINK_TTL_MINUTES` ya no se lee | Flujo nuevo de firma en el teléfono del técnico (lo define el dueño). **No** se borra la tabla (migraciones solo aditivas) |
| Socket `emit:location:real-time` (compatibilidad): `real-time-location` lo emite para el mapa del dashboard React | Se retira cuando la UI nueva use `tracking:location-updated` |
| Migración `20261127000000_servicio_borrado_logico` (dos columnas opcionales en `ServicioInternet` y en `Servicio`), aplicada solo en local | **En el deploy**: `prisma migrate deploy` |
| La base conserva las reglas antiguas: borrar un plan por SQL (o con `main`) deja clientes, accesos e instalaciones **sin plan**, y borrar un servicio adicional arrastra asignaciones y líneas de factura. La protección es de la aplicación; cambiar las llaves exige `DROP CONSTRAINT` | Solo con autorización del dueño |
| En producción (`main`) planes y servicios no piden sesión y `GET /servicio-internet` expone los clientes completos. El dueño decidió (26-nov-2026) no tocar `main` | Se cierra con el deploy. Hasta entonces no borrar planes |
| Revisar en producción: clientes activos sin plan (en la copia local 170, que no se facturan) y accesos PPPoE con un plan distinto al de su cliente (33 de 68) | El dueño, antes del deploy |
| Los crons y `contrato-cliente` leen los planes directamente de la tabla | `ciclo-facturacion` y `contrato-cliente` |
| Reemplazar los servicios de un cliente borra sus filas de `ClienteServicio` y las vuelve a crear: no queda historial y se pierde `fechaInicio` original | Cuando se rediseñen los servicios adicionales |
| El React envía `empresaId` y `estado` al crear planes, servicios y tipos: ahora responden 400 | La UI nueva (ver `cambios-contrato-ui.md`) |
| Migraciones `20261127010000_municipio_nombre_por_departamento` (cambia la unicidad del nombre e inserta 6 municipios; el `DROP INDEX` lo autorizó el dueño) y `20261127020000_sector_borrado_logico`, aplicadas solo en local | **En el deploy**: `prisma migrate deploy` |
| En producción (`main`) `GET /location/delete-all` borra departamentos, municipios y sectores sin sesión, y borrar sectores tampoco la pide. El dueño decidió no tocar `main` | Se cierra con el deploy. Mientras tanto, bloquear la ruta en el proxy y tener respaldo |
| La base conserva el borrado en cascada de departamentos, municipios y sectores: por SQL todavía se pierde la ubicación de los clientes | Solo con autorización del dueño |
| Datos de la copia local por revisar: 4 clientes con un sector de otro municipio, un sector sin nombre y sin clientes, y 11 de 160 coordenadas de clientes fuera de Guatemala | El dueño |
| La app Android (`checkpoint-android-studio`) no guarda el `refresh_token` ni renueva la sesión: con esta rama el access token dura 20 min | **Antes del deploy**: el dueño ajusta la app (§4.1 de la guía post-auth) |
| La app Android no puede cobrar contra esta rama: envía `cobradorId` y `observaciones` al pagar en ruta (400), exige `saldo.saldoFavor` y la forma vieja de las rutas, y el comprobante exige `empresa.id` y `servicios` (pasos 6 y 8) | El dueño la actualizará en su momento (decisión del 26-nov-2026): el servidor no conserva compatibilidad. Desplegar sin la app nueva deja a los cobradores sin cobrar |
| Migración `20261128000000_ticket_soporte_cancelacion_comentarios` (solo aditiva), aplicada solo en local | **En el deploy**: `prisma migrate deploy` |
| `ticket-soporte` avisa por `WebSocketServices`, `FirebasePushService` y `NotificacionesService`, y suma metas con `MetasTicketsService`, por adaptadores en su `infra/` | `common/tiempo-real`, `notificacion` y `ticket-soporte-metrica` |
| Metas: cada primer cierre suma a la última meta abierta del técnico aunque esté fuera de sus fechas (reabrir ya no suma) | `ticket-soporte-metrica` |
| **El cliente no tiene cómo firmar** la conformidad: el enlace público se retiró y la app aún lo llama | Paso aparte, el siguiente de tickets (decisión del dueño, 27-nov-2026) |
| Las imágenes de un comentario eliminado se ocultan pero siguen en el almacenamiento, visibles por enlace | Si el dueño pide destruirlas |
| `dashboard` sigue leyendo tickets directamente (panel del técnico, actividad, en proceso) | `dashboard` |
| En producción (`main`) y sin sesión: `DELETE /tickets-soporte/delete-all` borra todos los tickets, `DELETE /ticket-soluciones` todo el catálogo, y "eliminar etiqueta" cancela el ticket con ese número | Se cierra con el deploy. Mientras tanto, bloquear en el proxy y no eliminar etiquetas |
| La app Android y el React usan las rutas viejas de tickets (incluidas las dos de `dashboard`) | La UI nueva (ver `cambios-contrato-ui.md`, filas de `ticket-soporte`) |
| La copia local tiene 61 tickets y producción más de 5,400: las listas no se han medido con volumen real | Probar con una copia reciente antes del deploy |

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
- **Desinstalación:** completar una de cualquier tipo deja al cliente `DESINSTALADO` (salvo que
  conserve otro acceso vigente). Las completadas antes no se migran.
- **Eliminar un cliente es borrado lógico**; no habrá eliminación definitiva. Facturas, pagos,
  contrato e historial se conservan, y sus valores únicos (contrato, boleta, confirmación) siguen
  ocupados. El flujo para restaurar no existe todavía.
- **Zonas de facturación:** nunca se borran de la base; eliminar es borrado lógico y solo si no
  tienen clientes (también eliminados) ni facturas. Los canales (`whatsapp`, `email`, `sms`,
  `llamada`, `telegram`) y `horaRecordatorio` salieron de la API; sus columnas se quedan.
  `modoCorte` se diseña con la cobranza. `diaCorte` y `suspenderTrasFacturas` se conservan para ella.
- **Facturas y pagos:** el saldo, el estado y la fecha pagada salen de los pagos; a mano solo se
  anula o reactiva. Una factura con pagos no se elimina ni se anula; la eliminada queda en la
  bitácora. Eliminar un pago exige motivo, guarda su copia y libera su número. En depósito (así se
  registran las transferencias) el número es obligatorio e irrepetible. Cobra el usuario de la
  sesión. No hay saldo a favor. Los servicios adicionales se descartan hasta rediseñar sus tablas
  y crear su facturación. El cálculo de montos y fechas no cambió.
- **Rutas de cobro:** solo se cobra en una ruta abierta y a sus clientes (no se exige ser el
  cobrador asignado). Lo cobrado sale de los pagos de la ruta; los acumulados anteriores ya no se
  muestran. Eliminar es borrado lógico en cualquier estado. Editar solo cambia lo que llega y permite
  reabrir. El cobrador asignado debe estar activo. Un cliente puede estar en varias rutas.
- **Planes y servicios:** nunca se borran de la base. Eliminar es borrado lógico y solo si nunca
  se usaron (clientes, también eliminados, e historial); lo usado se desactiva. Un inactivo no admite
  asignaciones nuevas, pero quien ya lo tiene lo conserva y se le sigue facturando. El precio de un
  plan se cambia en su propia operación, con contraseña, e informa a cuántos clientes afecta. Los
  servicios adicionales conservan su catálogo con las mismas protecciones. Quien anote un plan o un
  servicio en sus tablas pasa por la fachada `SERVICIO` dentro de su unidad de trabajo.
- **Ubicación:** departamentos y municipios son de solo lectura (se cargan con
  `prisma/departamentos-municipios.sql`). Eliminar un sector es borrado lógico y solo sin clientes
  (también eliminados); con clientes no cambia de municipio. Lo que se asigne o cambie debe cuadrar
  (sector del municipio, municipio del departamento); lo antiguo no se toca. Quien asigne ubicación
  pasa por la fachada `UBICACION` dentro de su unidad de trabajo.
- **Mensajería:** las campañas se registran y se envían en segundo plano, una a la vez; reciben ids
  de clientes (el servidor busca los teléfonos), omiten con motivo a eliminados, con WhatsApp
  desactivado, sin teléfono válido o con número repetido, y no admiten plantillas con variables.
  Lo que quedó sin confirmar no se reenvía. `enviarRecordatorio` solo aplica a los recordatorios.
  Los avisos de crons y tickets conservan plantillas, variables y números.
- **Una empresa por base de datos, siempre:** ninguna ruta refactorizada pide `empresaId`; si una
  tabla lo necesita, sale de la sesión (`actor.empresaId`). No se agrega a DTO, rutas ni filtros
  nuevos.
- **Despliegue:** el servidor sale junto con una interfaz refactorizada; no se crea interfaz ni
  funciones nuevas en esta fase.
- **Los crons van al final** y tendrán un tratamiento especial que definirá el dueño. Hasta entonces
  no se toca su comportamiento (tampoco el de `credito`).
- **Reportes** no se migra hasta nuevo aviso.
- **Tickets** (27-nov-2026): estados Abierta → En proceso → En revisión → Resuelta, y Cancelada;
  sin pausar ni archivar (los antiguos se ven en la fase equivalente, sin modificarse). Un ticket
  nunca se borra: se cancela con motivo. La oficina cambia cualquier estado, edita, asigna y fija;
  el técnico ve y comenta solo los suyos y solo los inicia y envía a revisión; cualquiera con sesión
  crea. El reloj corre solo en proceso y sin registro no es cero; reabrir no suma a metas. El autor
  borra sus comentarios y la oficina cualquiera (borrado lógico); hasta 5 imágenes de 8 MB visibles
  por enlace. Etiquetas y soluciones se ocultan. La lista usa bandejas, búsqueda en todos los
  estados y activos del más antiguo al más nuevo, con el formato `{ data, meta }`. La solución al
  resolver es opcional. La firma del cliente es un paso aparte.

### 3.2 Orden de trabajo

En nombres, fusiones y alcance esta tabla manda sobre la propuesta de §15.1 del estándar.

| # | Paso / destino | Legacy | Estado | Notas |
|---|---|---|---|---|
| 0 | Limpieza | Las carpetas de §3.1 | ✅ Hecho | `refactorizacion limpieza #1–#7` y `dependencias #1` |
| 1 | **H1** saneamiento (sin crons) | `facturacion`, `cliente-internet`, `dashboard` | ✅ Hecho | `facturacion #1–#2`, `cliente-internet #1–#3`, `dashboard #1` (§6.1) |
| 2 | **H2** roles | API legacy que quede | En espera | El dueño definirá los permisos (§3.1). No agregar restricciones sin su mapa |
| 3 | Ubicación de técnicos → `real-time-location` | `real-time-location` legacy | ✅ Hecho | `real-time-location #3–#5`: rutas abiertas a cualquier sesión, `last-locations` en el módulo (misma ruta), retiro de `update-location` y de la carpeta legacy |
| 4 | `cliente` (H3) | `cliente-internet`, `customer-network-config` | ✅ Hecho | `cliente #1–#4`: fachada `CLIENTE`, borrado lógico, saldo calculado, rutas sin uso retiradas |
| 5 | `zona-facturacion` (H5) | `facturacion-zona` | ✅ Hecho | `zona-facturacion #1–#2`: borrado lógico, fachada `ZONA_FACTURACION`, una sola ruta de opciones |
| 6 | `facturacion` | `facturacion`, `factura-eliminacion` | ✅ Hecho | `facturacion #1–#2`: incluye los pagos; módulo `cliente-cobranza` para la cobranza |
| 7 | `mensajeria-cliente` (H6) | `whatsapp-template`, `cloud-api-meta`, `whatsapp-api-meta`, `whatsapp-campaigns` | ✅ Hecho | `mensajeria-cliente #1–#2`: campañas con historial, fachada `MENSAJERIA_CLIENTE`. **Nunca** enviar mensajes en pruebas |
| 8 | `ruta-cobro` | `ruta-cobro` | ✅ Hecho | `ruta-cobro #1–#2`: fachada `RUTA_COBRO`, borrado lógico, totales calculados, rutas web renombradas |
| 9 | `credito` | `credito` | Aplazado | Decisión del dueño (26-nov-2026): no urge. Ya parcialmente hexagonal. Su cron no cambia de comportamiento |
| 10 | `mikrotik-router` | `mikro-tik` | Fuera hasta nuevo aviso | Era para clientes por IP y ya usan PPPoE (dueño, 27-nov-2026). **No borrar** `src/mikro-tik`: PPPoE lo importa |
| 11 | `ticket-soporte` | `tickets-soporte`, `ticket-resumen`, `ticket-seguimiento`, `ticket-soluciones`, `tags-ticket`, `bot-functions` | ✅ Hecho | `ticket-soporte #1–#3`: bandejas, acciones de estado, comentarios con imágenes, reporte diario en hora de Guatemala; `unirseA` retirado |
| 12 | `notificacion` | `notificaciones`, `push-notifications`, `push-dispositivos` | Pendiente | Migrar y mejorar. Push = efecto real |
| 13 | `common/tiempo-real` | `web-sockets` | Pendiente | Incluye `POST /internal/server/broadcast` |
| 14 | `usuario` | `user`, `perfil` | Pendiente | Sin tocar `auth`; solo SUPER_ADMIN edita a otros |
| 15 | `contrato-cliente` | `contrato-cliente`, `id-contrato` | Pendiente | |
| 16 | `servicio` | `servicio`, `servicio-internet`, `tipo-servicio` | ✅ Hecho | `servicio #1–#3`: fachada `SERVICIO`, borrado lógico solo sin uso, precio con contraseña, rutas renombradas |
| 17 | `ubicacion` | `location`, `sector` | ✅ Hecho | `ubicacion #1–#3`: fachada `UBICACION`, borrado lógico de sectores, municipios completos y rutas destructivas retiradas |
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
  cambios a `src/common` van como `refactorizacion comun #N`; los de docs como
  `refactorizacion docs #N` (el siguiente número sale de `git log`).
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
| `modules/cliente-desinstalacion` | **Corregido** (paso 4): completar una desinstalación no marcaba al cliente `DESINSTALADO` | Hecho |
| Toda la API legacy | Sin `@Roles` (G1): cualquier usuario autenticado, técnico incluido, borra pagos, edita facturas y zonas | H2 |
| Sesiones, refresh e intentos de auth | Nadie los limpia (G6) | `tareas-programadas` |
| `src/real-time-location` legacy | **Corregido** (paso 3): su `POST update-location` permitía escribir la ubicación de otro usuario y registraba datos personales en los logs | Hecho |
| `SaldoCliente` | **Corregido** (pasos 4 y 6): el saldo se calcula al leer; el "saldo a favor" guardado era el total pagado y dejó de mostrarse | Hecho |
| `zona-facturacion-cron` día de pago | El interruptor `enviarAvisoPago` no se lee: avisa si el general está encendido aunque el aviso esté apagado | Crons |
| Zonas con días 29–31 | `shouldSkipZoneToday` las salta en meses cortos (en la copia local, una zona con generación el 30) | Crons |
| `facturacion` `delete-one-factura` | **Corregido** (paso 6): el usuario sale de la sesión | Hecho |
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
| 2 | **Resuelta**: se aprovechó, en `src/modules/cliente/domain/` | `cliente` | — |
| 3 | **Resuelta**: la app Android usa solo `real-time-location/*` (verificado en su repo) | Paso 3 | — |
| 4 | Nombres finales de cada módulo (§3.2) | Cada paso | Los de §3.2 |
| 5 | ¿La etapa auth ya se desplegó? Si no, cada paso se acumula sobre un deploy grande | Siempre que aplique | |
| 6 | **Resuelta**: cada módulo deja de usarla al refactorizarse, calculando al leer | `cliente`, `facturacion`, `ruta-cobro` | — |

---

## 8. Lecciones aprendidas (evitan horas)

- **Permisos:** no agregues `@Roles` a una ruta por convención (decisión de §3.1). Antes, mira qué
  roles usan esa pantalla en la app Android; en el paso 3 la restricción puesta en C5 la habría dejado
  con 403.
- **Zonas eliminadas:** toda consulta nueva que liste `FacturacionZona` filtra `eliminadoEn: null`.
- **Clientes eliminados:** toda consulta nueva sobre `ClienteInternet` (directa o por relación) debe
  filtrar `isEliminado: false`, salvo reportes o bitácoras que los pidan a propósito.
- **Si el dueño tiene `start:dev` corriendo**, no ejecutes `npm run build` (borra `dist` y su
  servidor): compila con `npx tsc -p tsconfig.build.json --outDir <carpeta temporal>`.
- **Probar adaptadores Prisma:** ejecútalos contra la base local dentro de
  `PrismaTransaccional.ejecutar` y lanza un error al final para revertir.
- **App Android:** https://github.com/CardonaSantos/ANDROID-BASE, rama `checkpoint-android-studio`
  (la que compiló el dueño). Sirve para verificar rutas, roles, cuerpos y eventos de socket antes de
  retirar o cambiar algo. Clónala fuera del proyecto y trátala solo como lectura. Compara también
  sus esquemas zod (`features/*/api/*.contracts.api.ts`) con la respuesta: un campo que falte la
  rompe aunque la ruta no cambie.
- **Probar por HTTP sin arrancar la aplicación:** `Test.createTestingModule` con solo los módulos
  del paso más `RelojModule`, `TransaccionModule`, `ValidacionModule` y `ExcepcionesModule`,
  `overrideModule(GatewayModule)` con sockets falsos y un middleware que ponga `req.user`. No corren
  crons ni integraciones. Verifica antes que la base sea local.
- **El build no detecta dependencias de Nest rotas.** Tras mover o borrar módulos, resuelve `AppModule`
  con `Test.createTestingModule({ imports: [AppModule] }).compile()` desde un script temporal en una
  carpeta **sin `.env`**, con `DATABASE_URL` apuntando a `127.0.0.1` y secretos ficticios (`JWT_SECRET`,
  `MIKROTIK_SECRET_KEY`). Sin `init()`: no arrancan crons ni conexiones.
- **Hay DTO legacy que el pipe estricto rechaza.** Al tocar un módulo, pasa por `ValidacionGlobalPipe`
  el cuerpo que envía su cliente y deja un spec (ver `cliente-internet/dto`).
- **Movimientos de dinero:** primero `CLIENTE_COBRANZA.bloquear` dentro de la unidad de trabajo y
  después se lee la factura; así dos cobros no se pisan.
- **Antes de permitir decimales o cambiar un formato,** mira el tipo de cada columna que lo recibe
  (`Ruta.montoCobrado` es entero y truncaba centavos). La prueba contra la base local lo detectó.
- **Axios con `HttpService`:** toma los tipos de `Parameters<HttpService['request']>`; importarlos
  de `axios` mezcla dos definiciones y no compila.
- **Candado sin fila que bloquear** ("solo uno a la vez"): `$executeRaw` con
  `pg_advisory_xact_lock` dentro de la unidad de trabajo (ver `campania-prisma.repository.ts`).
- **"Solo si no tiene uso" necesita bloqueo:** una llave foránea no ve el borrado lógico. Quien
  asigna toma la fila `FOR SHARE` dentro de su unidad de trabajo y quien elimina `FOR UPDATE`
  antes de comprobar (ver `zona-facturacion`).
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
- Pruebas HTTP con `TestingModule`: activa `app.getHttpAdapter().getInstance().set('query parser',
  'extended')` como `main.ts` (sin eso `ids[]=1` no se lee) y agrega `RolesGuard` a mano si
  sustituyes `AuthModule`.
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
