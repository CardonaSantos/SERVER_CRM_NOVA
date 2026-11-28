# CRM NOVA (servidor) — Guía de cobranza, corte por mora y tareas programadas

> **Diseño funcional del bloque final**: `tareas-programadas`, `cobranza` y `ciclo-facturacion`.
>
> | Dato | Valor |
> |---|---|
> | Versión | 2.0 · 28-nov-2026. Parte de la v1.0 del dueño (18-nov-2026), ajustada a lo que ya existe y a las decisiones del 27 y 28-nov-2026 |
> | Prioridad | En **forma** (carpetas, nombres, errores, respuestas) manda `estandar-hexagonal-crm-nova.md`. En **reglas de cobranza, horario y orden** manda esta guía. El estado y el siguiente paso están en `guia-fase-legacy-crm-nova.md` |
> | Cambios | Una decisión nueva o cambiada se anota en §2 en el mismo commit que la aplica |

---

## 1. Qué se busca

1. **Cortar automáticamente** el servicio PPPoE de los clientes morosos según la configuración de
   su zona de facturación, con aviso previo y días de gracia.
2. Que **ningún fallo corte el flujo**: un router apagado, un error de Meta o un cliente con datos
   raros afectan solo a ese router, ese mensaje o ese cliente.
3. Guardar la **lista de morosos a cortar** (lotes) como historial: revisable antes de ejecutarse,
   reintentable y auditada (quién la creó, aprobó, excluyó y ejecutó).
4. **Registrar cada comunicación** al cliente: factura, recordatorios, mora, suspensión, reactivación.
5. Que **todo cron** tenga candado, registro de ejecución y reintento, y que nada que llegue al
   cliente ocurra de noche.
6. Llegar a producción **sin perder ni alterar datos** (migraciones solo aditivas).

Fuera de esta etapa: reconexión automática al pagar (es manual, C2), promesas de pago (§12), corte
de clientes sin cuenta PPPoE (solo se reportan, C12), Redis o colas externas.

---

## 2. Decisiones

### 2.1 De la v1.0 (18-nov-2026)

| # | Decisión |
|---|---|
| **C1** | Un cliente **suspendido no se factura**. Se mantiene el filtro actual: solo se factura `estadoCliente = ACTIVO` |
| **C2** | La **reconexión es manual**, con el flujo PPPoE existente. Al reconectar se envía mensaje de **reactivación** |
| **C3** | La **gracia corre desde el aviso de mora**. El día de pago se le notifica; **un día después**, si no pagó y alcanzó el umbral, se le avisa que tiene X días de gracia antes del corte |
| ~~C4~~ | ~~Sin restricción de horario ni de días para cortar~~ → **reemplazada por C19** |
| **C5** | Si el aviso de mora **no se puede entregar**, se reintenta durante 24 h; si no llega, la gracia corre desde el **primer intento** y el cliente aparece marcado **"sin aviso"** en el lote |
| **C6** | El aviso de mora se envía **aunque** el cliente tenga `enviarRecordatorio = false` (es aviso de corte). Solo se omite si no hay WhatsApp posible, y entonces aplica C5 |
| **C7** | Si se reactiva a mano a un cliente que **sigue** en mora, al día siguiente se abre un **caso nuevo** (aviso y gracia completa), salvo que se le excluya (§3.7) |
| **C8** | Si se reactiva **después** del día de generación, ese mes **no** se factura automáticamente: se avisa a la oficina y decide con la generación manual existente |
| **C9** | Una factura **`PARCIAL` vencida cuenta igual** que una completa. **Sin monto mínimo** |
| **C10** | Aprueban y ejecutan lotes **ADMIN y SUPER_ADMIN** (`ROLES_ADMINISTRACION`), con contraseña (`@OperacionSensible`) |
| **C11** | Promesas de pago: después, sin desfasar a las zonas (§12) |
| **C12** | Clientes **sin cuenta PPPoE**: solo se **reportan** en el lote. Cuando tengan cuenta entran al flujo normal sin hacer nada más |
| **C13** | En producción corre **una sola instancia**. Igual se diseña seguro para varias |
| **C14** | Las **plantillas de Meta** (aviso de mora, suspensión, reactivación) las redacta el negocio. El sistema las toma de configuración y **no permite cortar** si faltan |
| **C15** | Para la mora se cuentan **solo facturas vencidas** (`fechaPagoEsperada` anterior a hoy) |
| **C16** | `FacturacionZona.diaCorte` significa **días de gracia**. En el dominio se llama `diasGraciaCorte`; la columna **no** se renombra |
| **C17** | La cola de trabajo es **Postgres** (cron de Nest + candado + tablas). Sin Redis |
| **C18** | Salida gradual por zona con `modoCorte`: `DESACTIVADO → SOLO_LISTA → CON_APROBACION → AUTOMATICO`. Cada zona pasa **al menos un ciclo** en `SOLO_LISTA` (28-nov-2026) |

### 2.2 Del 27 y 28-nov-2026

| # | Decisión |
|---|---|
| **C19** | **Todo lo automático que llega al cliente** (mensajes y cortes) ocurre **de 10:00 a 18:00** hora de Guatemala, **todos los días** (también domingos y feriados: la gracia ya se cuenta en días). Lo que no termine a las 18:00 espera a la jornada siguiente. Lo que hace una persona a mano (reconectar y su mensaje) sale en el momento |
| **C20** | Las etapas corren en **una jornada en secuencia** a las 10:00 (facturación → envío → cobranza → envío → resumen) y un **repaso cada 30 minutos** hasta las 18:00 retoma lo pendiente (§4). No hay cron cada minuto |
| **C21** | **Candado por arriendo** sobre una fila del registro; ninguna transacción larga (§4.4) |
| **C22** | Las tareas internas que no tocan clientes (mora de créditos, limpieza, foto mensual, tracking) corren **de madrugada** o fuera de la jornada |
| **C23** | Si el servidor estuvo caído un día, la jornada siguiente **se pone al día** con lo que depende del estado (facturas del periodo, mora, cortes pendientes) y **no** envía tarde los recordatorios de fecha fija |
| **C24** | `ciclo-facturacion` reemplaza a los crons legacy **de una vez**, sin bandera por zona; la paridad se comprueba solo en local y sin enviar |
| **C25** | Ningún mensaje real en pruebas: la copia local tiene teléfonos reales. Meta es un falso en specs y un doble en pruebas contra la base; los interruptores vienen apagados (§9) |
| **C26** | El porqué de cada suspensión se ve en la ficha del cliente: ruta de solo lectura del historial de estados (oficina) |
| **C27** | El servidor manda en el contrato (no hay compatibilidad con el React). Errores, listados y roles según el estándar |

---

## 3. Reglas de cobranza y corte

### 3.1 Definiciones

```
hoyGT               = RELOJ.fechaOperativa()                       (YYYY-MM-DD en Guatemala)
inicioHoyGT         = hoyGT 00:00 en Guatemala (inicioDiaNegocio)
facturaPendiente(f) = f.estadoFacturaInternet ∈ {PENDIENTE, PARCIAL, VENCIDA}   (sin anuladas ni eliminadas)
facturaVencida(f)   = facturaPendiente(f) ∧ f.fechaPagoEsperada < inicioHoyGT
vencidas(cliente)   = # facturas vencidas del cliente (todas las zonas)
montoVencido        = Σ saldoPendiente de las vencidas
umbral(zona)        = zona.suspenderTrasFacturas                   (entero ≥ 1)
diasGracia(zona)    = zona.diaCorte                                (entero ≥ 0, C16)
esMoroso            = vencidas ≥ umbral
```

### 3.2 Quién se evalúa

- `isEliminado = false`, `desinstaladoEn = null`, `estadoCliente = ACTIVO`.
- Su zona tiene `modoCorte ≠ DESACTIVADO`, `eliminadoEn = null`, y `suspenderTrasFacturas` y
  `diaCorte` no nulos.
- `excluirCorteAutomatico = false`.

Los `SUSPENDIDO` no abren casos: se revisan en la **reconciliación** (§5.4).

### 3.3 Calendario de un caso (ejemplo)

Zona: `diaPago = 5`, `suspenderTrasFacturas = 2`, `diaCorte = 5`.

| Fecha | Qué pasa |
|---|---|
| 5-oct | Aviso del día de pago. No paga |
| 6-oct | Vencidas = 1 < 2: no hay caso |
| 5-nov | Aviso del día de pago. No paga |
| 6-nov | Vencidas = 2 → se **abre el caso** y se encola el **aviso de mora**. Al confirmarse el envío: `cortarDesde = 11-nov` |
| 7–10 nov | Si paga, la evaluación diaria cierra el caso `RESUELTO(PAGO)` |
| 11-nov | Sigue moroso → entra al **lote** del día → se **suspende** → mensaje de suspensión. Desde aquí no se factura (C1) |
| Cuando pague | La oficina lo **reconecta a mano** (C2) → mensaje de reactivación → la reconciliación cierra el caso `RESUELTO(REACTIVADO)`. Si aún tiene 2 vencidas, al día siguiente hay caso nuevo (C7) |

### 3.4 Fecha de corte

```
fechaBaseGracia = fecha GT de aviso.enviadaEn          si Meta lo aceptó
                = fecha GT de aviso.primerIntentoEn    si quedó NO_ENTREGABLE (C5)
cortarDesde     = fechaBaseGracia + diasGraciaAplicados
```
- `diasGraciaAplicados` y `umbralAplicado` se **congelan** en el caso al abrirlo.
- Se corta en la primera jornada o repaso con `hoyGT ≥ cortarDesde`, dentro de la ventana (C19).
- Con gracia 0, el corte sale el mismo día del aviso, en un repaso posterior.

### 3.5 Aviso de mora no entregable (C5, C6)

| Situación | Tratamiento |
|---|---|
| Sin teléfono válido o `whatsappActivo = false` | `NO_ENTREGABLE` de inmediato; `primerIntentoEn = ahora` |
| Meta rechaza o falla | Reintentos con espera creciente durante 24 h (solo en la ventana). Si ninguno se acepta: `NO_ENTREGABLE` con base en el primer intento |
| `enviarRecordatorio = false` | Se ignora: el aviso de mora se envía igual |
| Plantilla no configurada | No se abre el caso como real: la etapa falla con `COBRANZA_PLANTILLA_NO_CONFIGURADA` y la zona no puede estar en modo real |

El renglón del lote copia `sinAviso = true` cuando el aviso quedó `NO_ENTREGABLE`.

### 3.6 Revalidación justo antes de cortar cada renglón

0. El caso tiene aviso real (`ENVIADO` o `NO_ENTREGABLE`) y `hoyGT ≥ cortarDesde`.
1. El cliente sigue elegible (§3.2).
2. Sigue moroso (si pagó: renglón `OMITIDO_PAGADO` y caso `RESUELTO(PAGO)`).
3. Su cuenta PPPoE vigente existe y está `ACTIVA` (si cambió: `OMITIDO_NO_APLICA`; si ya no hay:
   `SIN_CUENTA_PPPOE`).
4. El renglón no fue excluido.
5. Estamos dentro de la ventana de 10:00 a 18:00 y el interruptor de corte está encendido.

### 3.7 Exclusiones

| Acción | Efecto | Quién |
|---|---|---|
| Excluir renglón del lote (motivo) | Renglón `EXCLUIDO`; el caso vuelve a `ABIERTO` y reaparece en el lote del día siguiente | `ROLES_ADMINISTRACION` |
| Cancelar caso (motivo) | Caso `CANCELADO`. Si sigue moroso, la evaluación siguiente abre uno nuevo con aviso y gracia completa | `ROLES_ADMINISTRACION` |
| Excluir al cliente del corte automático (motivo) | No se evalúa hasta quitar la marca; sus casos abiertos se cancelan (`EXCLUIDO_MANUAL`) | `ROLES_ADMINISTRACION` |

### 3.8 Cuenta PPPoE vigente

```
acceso = acceso a internet del cliente con método PPPoE y estado ACTIVO
cuenta = cuenta PPPoE de ese acceso con estado ACTIVA
router = el de la homologación del perfil de la cuenta     (no ClienteInternet.mikrotikRouterId)
```
Más de un acceso PPPoE `ACTIVO` → renglón `OMITIDO_NO_APLICA` con `COBRANZA_CUENTA_AMBIGUA`.
La lectura se hace por las fachadas `PPPOE_ACCESO_INTERNET` y `PPPOE_CLIENTE_CUENTA`.

### 3.9 Motivo de cada suspensión (C26)

- **Manual** (`POST /pppoe-cuentas/:id/suspender`, oficina, con contraseña): el motivo es obligatorio
  (5–500 caracteres).
- **Por cobranza**: lo escribe el sistema, por ejemplo "Corte por mora: 2 facturas vencidas, aviso
  de mora del 6-nov, 5 días de gracia". El renglón guarda su caso y su operación PPPoE.
- En los dos casos queda en `PppoeOperacion.motivo`, en `PppoeAuditoria` (quién, IP, estados) y en
  `ClienteEstadoHistorial.motivo`, que se lee con `GET /internet-customer/:id/historial-estado`.

---

## 4. Horario, orquestación y candado

### 4.1 El día completo

| Hora (GT) | Qué corre | Toca clientes |
|---|---|---|
| 00:30 del día 1 (reintento cada hora hasta las 05:30) | Foto mensual de clientes y cobranza (`dashboard`, para las gráficas de evolución) | No |
| 01:00 | Mora de cuotas de crédito (`credito`, lógica sin cambios) | No |
| 03:00 | Limpieza, una tarea por módulo dueño: `LIMPIEZA_SESIONES` (`auth`: sesiones revocadas o vencidas hace más de 30 días con sus refresh, intentos de más de 90), `LIMPIEZA_NOTIFICACIONES` (`notificacion`: más de 90 días, con su bandeja) y `LIMPIEZA_EJECUCIONES` (`tareas-programadas`: más de 180 días) | No |
| :45 de cada 2 h (01:45 … 23:45) | Cierre de recorridos de técnicos abandonados (`real-time-location`) | No |
| **10:00** | **Jornada** (§4.2) | Sí |
| 10:30 … 17:30, cada 30 min | **Repaso** (§4.3) | Sí |
| 18:00 en adelante | Nada que llegue al cliente | — |

### 4.2 La jornada (10:00)

Toma el candado `JORNADA:<hoyGT>` y recorre las fases **en orden**. Cada etapa tiene su fila en el
registro; lo completado no se repite.

| Fase | Etapas (por zona) | Módulo |
|---|---|---|
| 1. Facturación | `GENERAR_FACTURAS`, `ENVIAR_AVISO_GENERACION`, `ENVIAR_RECORDATORIO_1`, `ENVIAR_RECORDATORIO_2`, `ENVIAR_AVISO_DIA_PAGO` | `ciclo-facturacion` (antes, los crons legacy envueltos) |
| 2. Envío | `DESPACHAR_COMUNICACIONES` | `mensajeria-cliente` |
| 3. Cobranza | `EVALUAR_MORA`, `RECONCILIAR_SUSPENDIDOS`, `ARMAR_LOTE_CORTE`, `EJECUTAR_LOTE_CORTE` | `cobranza` |
| 4. Envío | `DESPACHAR_COMUNICACIONES` (avisos de mora y suspensión) | `mensajeria-cliente` |
| 5. Resumen | Notificación a la oficina (`NOTIFICACION`, todos menos técnicos) | `tareas-programadas` |

- Las facturas y mensajes se generan **en la cola**; la fase de envío los manda uno por uno con una
  pausa corta. El corte empieza cuando termina lo anterior, sin hora fija.
- Mientras existan los crons legacy (`tareas-programadas #2` hasta `ciclo-facturacion`): el aviso de
  generación va dentro de `GENERAR_FACTURAS` y las cuatro etapas tienen un solo intento por zona
  (`reintentable: false`), porque repetirlas reenviaría avisos. Sus días siguen la regla vieja (sin
  ponerse al día ni ajuste de los días 29–31).
- Un error con un cliente se anota (id y código) y se sigue. Un error de una etapa completa (BD
  caída, plantilla faltante) la deja `FALLIDA` y la jornada sigue con las demás.
- Ningún otro trabajo pesado corre mientras la jornada tiene el candado; una ejecución manual recibe
  `409 TAREA_PROGRAMADA_EN_CURSO`.

### 4.3 El repaso (cada 30 min, de 10:30 a 17:30)

1. Si la jornada del día no está completa (el servidor estuvo caído o se reinició), la retoma.
2. Etapas `FALLIDA` cuya hora de reintento llegó (máximo 3 intentos por día).
3. Comunicaciones con reintento vencido (`DESPACHAR_COMUNICACIONES`).
4. Renglones de corte `BLOQUEADO_ROUTER` o `FALLIDO` con intentos disponibles, y lotes aprobados a mano.

Si no hay nada, es una consulta y termina. Lo que quede a las 18:00 espera a la jornada siguiente,
que antes revalida (§3.6).

### 4.4 Candado por arriendo (C21)

- **Tomar:** insertar la fila `(clave)` en `TareaProgramadaEjecucion` con estado `EJECUTANDO` y
  `bloqueadoHasta = ahora + 10 min`. Si la clave ya existe (`P2002`): está completa → se salta; está
  `EJECUTANDO` con arriendo vigente → otra ejecución la tiene, se sale; `EJECUTANDO` con arriendo
  vencido o `FALLIDA` con reintento → se **retoma** con `updateMany` condicionado
  (`WHERE estado = … AND bloqueadoHasta < ahora`) e `intentos + 1`. Si afectó 0 filas, otro la tomó.
- **Renovar:** mientras corre, un temporizador alarga el arriendo cada minuto.
- **Terminar:** `COMPLETADA`, `COMPLETADA_CON_ERRORES` o `FALLIDA` con resumen.
- El trabajo **nunca** vive dentro de una transacción larga: cada cliente o renglón se guarda en su
  propia transacción corta. Si el proceso muere, nadie renueva; a los 10 min la fila está abandonada y
  el repaso la retoma. Retomar no repite nada gracias a las claves únicas de facturas, comunicaciones,
  casos, lotes y operaciones PPPoE.
- Se descartó `pg_advisory_xact_lock` (exige una transacción abierta toda la jornada, con E/S remota
  dentro) y `pg_advisory_lock` de sesión (con el pool de Prisma no hay garantía de liberarlo en la
  misma conexión). El candado corto existente (`pg_advisory_xact_lock` en campañas) se sigue usando
  para secciones de milisegundos.

### 4.5 Claves

| Uso | Formato | Ejemplo |
|---|---|---|
| Jornada | `JORNADA:<fecha>` | `JORNADA:2027-03-06` |
| Etapa diaria por zona | `<ETAPA>:zona-<id>:<fecha>` | `EVALUAR_MORA:zona-3:2027-03-06` |
| Generación (por periodo, permite ponerse al día, C23) | `GENERAR_FACTURAS:zona-<id>:<YYYY-MM>` | `GENERAR_FACTURAS:zona-3:2027-03` |
| Tarea suelta | `<TAREA>:<fecha>` o `<TAREA>:<fecha>T<hora>` | `LIMPIEZA:2027-03-06`, `TRACKING_EXPIRACION:2027-03-06T09:45` |
| Comunicación | `<TIPO>:<referencia>-<id>` | `AVISO_MORA:caso-120`, `SUSPENSION:renglon-812`, `REACTIVACION:operacion-77`, `FACTURA_GENERADA:factura-9921`, `RECORDATORIO_1:factura-9921` |
| Operación PPPoE de corte | `CORTE:renglon-<id>:<intento>` | `CORTE:renglon-812:1` |

### 4.6 Ponerse al día (C23)

| Etapa | Si se perdió el día |
|---|---|
| `GENERAR_FACTURAS` | Se genera en la siguiente jornada del mismo periodo si la etapa del periodo no está completa. Los reactivados después siguen C8 |
| `EVALUAR_MORA`, `RECONCILIAR_SUSPENDIDOS`, cortes | Dependen del estado: la siguiente jornada los hace con los datos de ese día |
| Avisos de generación, recordatorios y aviso de día de pago | **No** se envían tarde. El resumen de la jornada avisa que faltó ese día |
| Aviso de mora | Depende del estado del caso: sale en cuanto se puede |

### 4.7 Días 29, 30 y 31

Todo "día del mes" de una zona (generación, recordatorios, pago) se ajusta al **último día** en
meses cortos (policy pura con pruebas de febrero, años bisiestos y cambio de año). Corrige
`shouldSkipZoneToday`.

---

## 5. Flujos de cobranza

### 5.1 `EvaluarMoraZona`

```
config = zona (modo, umbral, gracia); validar requisitos
por bloques de 200 clientes elegibles (§3.2):
  r = resumen de vencidas del cliente (una consulta agregada)
  caso = caso abierto del cliente (ABIERTO | EN_COLA | SUSPENDIDO)
  si esMoroso y no hay caso:
      unidad de trabajo: crear CasoMora (umbral y gracia congelados, aviso PENDIENTE)
                         + MENSAJERIA_CLIENTE.encolar(AVISO_MORA:caso-<id>)
  si no es moroso y el caso está ABIERTO: cerrar(PAGO)
  error con un cliente → al resumen (id + código) y seguir
```
En `SOLO_LISTA` la comunicación se registra `OMITIDA` con motivo `SIMULACION`, el caso queda
`OMITIDO_SIMULACION` y la gracia cuenta desde la detección: la simulación muestra las mismas fechas
que tendría en real.

**Cambio de modo de la zona:** de `SOLO_LISTA` a modo real se **cancelan** en la misma transacción
sus casos `ABIERTO` simulados (`CAMBIO_MODO_ZONA`); la evaluación siguiente los reabre con aviso
real y gracia completa. Nadie se corta sin aviso real. A `DESACTIVADO`: los casos se conservan sin
avanzar y los lotes pendientes de aprobación o aprobados se cancelan.

### 5.2 Resultado del aviso de mora

Al inicio de `EVALUAR_MORA` y de `ARMAR_LOTE_CORTE`, cobranza consulta el estado de los avisos
pendientes (`MENSAJERIA_CLIENTE.obtenerEstado(clave)`): `ENVIADA` fija `cortarDesde` desde el envío;
`NO_ENTREGABLE` (o 24 h fallida) lo fija desde el primer intento. Mensajería no conoce a cobranza.

### 5.3 `ArmarLoteCorte`

```
casos ABIERTO con cortarDesde ≤ hoyGT; si no hay → "sin lote"
unidad de trabajo:
  LoteCorte(zona, hoyGT, origen CRON, modo SIMULACION | REAL,
            estado COMPLETADO (simulación) | PENDIENTE_APROBACION | APROBADO (automático))
  por caso: cuenta vigente (§3.8) → renglón SIMULADO | SIN_CUENTA_PPPOE | PENDIENTE
            (copia vencidas, monto, router, cuenta, sinAviso); PENDIENTE en real → caso EN_COLA
  evento CREADO
```
Un lote `CRON` por zona y día (índice único parcial); si ya existe, la etapa no hace nada.

### 5.4 `ReconciliarSuspendidosZona`

```
por cada caso SUSPENDIDO de la zona:
  cliente eliminado o desinstalado → cerrar(CLIENTE_NO_ELEGIBLE)
  cliente ACTIVO (reconectado a mano) → cerrar(REACTIVADO)
      si hoy pasó el día de generación y no hay factura del periodo → aviso a la oficina (C8)
```
El mensaje de reactivación **no** sale aquí: sale cuando la oficina reconecta (§5.6).

### 5.5 `EjecutarLoteCorte` y `EjecutarRenglonCorte`

```
reclamar lote (updateMany estado IN (APROBADO, COMPLETADO_CON_PENDIENTES) → EN_EJECUCION)
renglones = PENDIENTE | BLOQUEADO_ROUTER | FALLIDO con intentos < zona.maxReintentosCorte
agrupar por router; un router a la vez, sus renglones de uno en uno
  router sin respuesta → sus renglones BLOQUEADO_ROUTER (sin crear operación PPPoE); seguir
  por renglón:
    revalidar (§3.6) → si no aplica: OMITIDO_* y salir
    reclamar renglón → EN_PROCESO, intentos + 1
    PPPOE_PROVISIONAMIENTO.suspenderServicio({ cuentaPppoeId, claveIdempotencia: CORTE:renglon-<id>:<intento>,
                                               motivo (§3.9), actor: { origen: COBRANZA_AUTOMATICA, iniciadoPorId } })
      EXITOSA → unidad de trabajo: renglón SUSPENDIDO, caso SUSPENDIDO, encolar SUSPENSION:renglon-<id>
      otra    → renglón FALLIDO (operación, código, mensaje seguro)
cerrar lote: COMPLETADO o COMPLETADO_CON_PENDIENTES; totales; evento; aviso a la oficina
```
- `iniciadoPorId` es `null` si lo ejecuta la jornada y el id de la persona si lo ejecuta a mano.
- **Reanudación:** renglones `EN_PROCESO` de más de 10 min se reprocesan con la **misma clave**; el
  motor PPPoE devuelve el resultado existente sin repetir el SSH. Si la operación quedó
  `EJECUTANDO`, el renglón pasa a `FALLIDO` con `COBRANZA_OPERACION_REQUIERE_RECUPERACION` y se
  resuelve con `POST /pppoe-operaciones/:id/recuperar`.
- **Con aprobación:** `POST /cobranza/lotes-corte/:id/aprobar` (contraseña) lo deja `APROBADO`; lo
  ejecuta el siguiente repaso dentro de la ventana (o la jornada siguiente).

### 5.6 Reactivación y su mensaje (C2, C19)

`pppoe-automatizacion` publica un evento en proceso al confirmar una reactivación (mismo patrón que
`SesionesService.eventos` con `notificacion`). `cobranza` lo escucha en `presentation/eventos`, encola
`REACTIVACION:operacion-<id>` y pide el envío en el momento. Así `pppoe-*` no depende de `cobranza`.

### 5.7 Envío de comunicaciones (`mensajeria-cliente`)

```
tomar PENDIENTE con programadaPara ≤ ahora, de a 50 (FOR UPDATE SKIP LOCKED → ENVIANDO)
por cada una:
  datos de contacto del cliente
  tipo ≠ AVISO_MORA y !enviarRecordatorio → OMITIDA(CLIENTE_SIN_RECORDATORIOS)
  !whatsappActivo o sin teléfono → AVISO_MORA ? NO_ENTREGABLE : OMITIDA(SIN_DESTINO)
  sin plantilla → FALLIDA(PLANTILLA_NO_CONFIGURADA), sin reintento
  enviar → ENVIADA(ids de Meta, enviadaEn) | FALLIDA(intentos + 1, programadaPara = ahora + espera)
  espera: 30 min, 1 h, 2 h, 4 h; AVISO_MORA con 24 h desde el primer intento → NO_ENTREGABLE
fuera de la ventana o con el interruptor apagado: no se envía nada (quedan PENDIENTE)
```
- Varios teléfonos: `ENVIADA` si Meta aceptó al menos uno.
- Lo que quedó `ENVIANDO` cuando el proceso murió pasa a `SIN_CONFIRMAR` y **no se reenvía**
  (igual que las campañas).
- Los envíos sueltos de tickets siguen como hoy (`enviarPlantilla`).

---

## 6. Módulos y puertos

### 6.1 Mapa

```
tareas-programadas  ◀── registran etapas y tareas ── ciclo-facturacion, cobranza, mensajeria-cliente,
 (registro, arriendo,                                  credito (legacy), real-time-location, limpieza
  jornada, repaso)
cobranza ──▶ CLIENTE, CLIENTE_COBRANZA, ZONA_FACTURACION, FACTURACION, MENSAJERIA_CLIENTE,
             PPPOE_PROVISIONAMIENTO, PPPOE_ACCESO_INTERNET, PPPOE_CLIENTE_CUENTA, NOTIFICACION
ciclo-facturacion ──▶ FACTURACION, CLIENTE_COBRANZA, ZONA_FACTURACION, SERVICIO, MENSAJERIA_CLIENTE, NOTIFICACION
```
**Prohibido:** `tareas-programadas` → módulos de negocio; `pppoe-*`, `cliente`, `mensajeria-cliente`
→ `cobranza`. Los módulos base no conocen a quien los usa.

### 6.2 `tareas-programadas` (fachada `TAREAS_PROGRAMADAS`)

| Método | Para qué |
|---|---|
| `registrarEtapa({ tarea, fase, orden, ejecutar(etapa) })` | Una etapa de la jornada. La registra el módulo dueño al iniciar (`onModuleInit`). El repaso la vuelve a llamar |
| `etapa.ejecutarPaso({ clave, tarea, facturacionZonaId?, reintentable?, trabajo })` | Va en el contexto de la etapa, no en la fachada: un paso por zona con arriendo, registro y salto de lo completado, con la fecha de la jornada. Fuera de la ventana no empieza (`FUERA_DE_VENTANA`) |
| `ejecutarTarea({ clave, tarea, fechaOperativa, reintentable?, trabajo })` | Tarea suelta con candado y registro (crédito, limpieza, tracking, foto) |

El contexto de la etapa trae `fechaOperativa`, `momento` (`JORNADA` o `REPASO`) y
`dentroDeVentana()`; el de cada paso o tarea, un acumulador de conteos y errores por elemento (máximo
50 en el resumen, solo ids y códigos). `reintentable: false` deja un solo intento: lo fallido o
abandonado no se retoma (para lo que enviaría dos veces un aviso). Interruptor global
`TAREAS_PROGRAMADAS_ACTIVAS`.

### 6.3 Lo que se agrega a módulos existentes

| Módulo | Qué |
|---|---|
| `mensajeria-cliente` | Tabla `ComunicacionCliente` y en `MENSAJERIA_CLIENTE`: `encolar(...)` (dentro de la unidad de trabajo del llamador), `obtenerEstado(clave)`, `despacharPendientes()`; etapa `DESPACHAR_COMUNICACIONES` |
| `zona-facturacion` | `modoCorte`, `maxReintentosCorte`, quién y cuándo cambió el modo; validación de requisitos (§3.5); lectura de la configuración de corte en `ZONA_FACTURACION` |
| `cliente` | Exclusión del corte (4 columnas) y rutas de exclusión, comunicaciones e historial de estado |
| `pppoe-automatizacion` | Evento de reactivación confirmada (§5.6); los logs del ejecutor de suspensión pasan a solo ids |
| `facturacion` / `cliente-cobranza` | Lo que `ciclo-facturacion` necesite para generar facturas y recalcular cobranza por fachada (hoy los crons escriben directo) |

### 6.4 `cobranza` (árbol del estándar §2)

```
domain/entities       caso-mora · lote-corte · renglon-corte
domain/policies       politica-morosidad · politica-gracia · politica-revalidacion-corte
domain/ports          caso-mora-repository · lote-corte-repository · cobranza-query
application/use-cases evaluar-mora-zona · reconciliar-suspendidos-zona · armar-lote-corte · ejecutar-lote-corte ·
                      ejecutar-renglon-corte · aprobar-lote-corte · cancelar-lote-corte · excluir-renglon-lote ·
                      reintentar-renglon-corte · cancelar-caso-mora · encolar-reactivacion · listar/obtener…
application/ports     conectividad-router.port.ts (probar el router antes de cortar)
presentation/cron     cobranza.cron.ts (registra sus etapas)
presentation/eventos  reactivacion-confirmada.listener.ts
```

---

## 7. Modelo de datos (nuevo y agregado)

### 7.1 Registro de ejecuciones (`tareas-programadas #1`)

```prisma
enum EstadoTareaProgramada { EJECUTANDO COMPLETADA COMPLETADA_CON_ERRORES FALLIDA }
enum OrigenTareaProgramada { PROGRAMADA MANUAL }

model TareaProgramadaEjecucion {
  id                 Int                   @id @default(autoincrement())
  clave              String                @unique
  tarea              String                // nombre de dominio (GENERAR_FACTURAS, LIMPIEZA…)
  facturacionZonaId  Int?
  fechaOperativa     DateTime              @db.Date
  origen             OrigenTareaProgramada @default(PROGRAMADA)
  ejecutadaPorId     Int?                  // ejecución manual
  estado             EstadoTareaProgramada
  intentos           Int                   @default(1)
  bloqueadoHasta     DateTime?             // arriendo
  siguienteIntentoEn DateTime?
  iniciadaEn         DateTime
  finalizadaEn       DateTime?
  procesados         Int                   @default(0)
  errores            Int                   @default(0)
  resumen            Json?                 // conteos y hasta 50 errores (id + código)
  errorCodigo        String?
  errorMensaje       String?               // texto seguro, nunca stack ni datos personales
  creadoEn           DateTime              @default(now())
  actualizadoEn      DateTime              @updatedAt

  @@index([fechaOperativa, tarea])
  @@index([estado, bloqueadoHasta])
}
```

### 7.2 Foto mensual (`tareas-programadas #3`)

Tabla `FotoMensualCartera`, del módulo `dashboard` (es quien la grafica). Una fila por mes (`mes`
`YYYY-MM`, único) que se toma el día 1 a las 00:30 (`FOTO_MENSUAL:<mes>`), antes de la jornada, y nunca
se reemplaza. El cron vuelve cada hora hasta las 05:30 como reintento. Guarda solo lo que no se puede recalcular después, con las reglas del panel:

| Grupo | Columnas |
|---|---|
| Clientes no eliminados por estado de servicio | `totalClientes`, `activos`, `suspendidos`, `pendientesActivacion`, `enInstalacion`, `desinstalados` |
| Cobranza (sin desinstalados) | `alDia`, `pagoPendiente`, `atrasados`, `morosos` |
| Deuda (sin desinstalados, facturas con saldo) | `facturasConDeuda`, `clientesConDeuda`, `clientesConDeudaVencida`, `deuda`, `deudaVencida` |
| Aparte | `deudaDesinstalados`, `tomadaEn` |

Lo facturado y lo cobrado de cada mes no se guarda: sale de las facturas (`periodo`) y los pagos. Si
el servidor no está entre las 00:30 y las 05:30 del día 1, ese mes queda sin foto (no se toma tarde con
datos de otro día). La
gráfica que la lee es una ruta aparte del `dashboard`.

### 7.3 `FacturacionZona` y `ClienteInternet` (columnas nuevas)

```prisma
enum ModoCorteZona { DESACTIVADO SOLO_LISTA CON_APROBACION AUTOMATICO }

// FacturacionZona
modoCorte                 ModoCorteZona @default(DESACTIVADO)
maxReintentosCorte        Int           @default(3)
modoCorteActualizadoPorId Int?
modoCorteActualizadoEn    DateTime?

// ClienteInternet
excluirCorteAutomatico Boolean   @default(false)
motivoExclusionCorte   String?
excluidoCortePorId     Int?
excluidoCorteEn        DateTime?
```

### 7.4 Comunicaciones (`mensajeria-cliente`)

```prisma
enum TipoComunicacionCliente { FACTURA_GENERADA RECORDATORIO_1 RECORDATORIO_2 DIA_PAGO AVISO_MORA SUSPENSION REACTIVACION }
enum EstadoComunicacion      { PENDIENTE ENVIANDO ENVIADA FALLIDA OMITIDA NO_ENTREGABLE SIN_CONFIRMAR }

model ComunicacionCliente {
  id                  Int                     @id @default(autoincrement())
  empresaId           Int
  clienteId           Int
  tipo                TipoComunicacionCliente
  plantilla           String?
  destinos            String[]
  variables           Json
  estado              EstadoComunicacion      @default(PENDIENTE)
  motivoEstado        String?
  intentos            Int                     @default(0)
  programadaPara      DateTime
  primerIntentoEn     DateTime?
  enviadaEn           DateTime?
  proveedorMensajeIds String[]
  errorCodigo         String?
  claveIdempotencia   String                  @unique
  facturaInternetId   Int?
  casoMoraId          Int?
  renglonCorteId      Int?
  creadoEn            DateTime                @default(now())
  actualizadoEn       DateTime                @updatedAt

  @@index([estado, programadaPara])
  @@index([clienteId, creadoEn])
}
```

### 7.5 Cobranza

`CasoMora`, `LoteCorte`, `RenglonCorte` y `LoteCorteEvento` (bitácora de solo agregar), con los campos
de la v1.0:

- **Caso:** vencidas y monto al abrir, factura más antigua, umbral y gracia aplicados, estado del aviso
  y sus fechas, `cortarDesde` (`@db.Date`), suspensión y cierre (motivo, quién, comentario).
- **Lote:** zona, fecha operativa, origen (`CRON`/`MANUAL`), modo (`SIMULACION`/`REAL`), estado, quién
  creó, aprobó, ejecutó o canceló y cuándo, y totales.
- **Renglón:** caso, cliente, acceso, cuenta, router, estado, vencidas, monto, `sinAviso`, intentos,
  operación PPPoE, último error, exclusión.

Montos `Decimal(12,2)` en tablas nuevas; el presenter los entrega como `number` (estándar §7.3).

Enums:

```
EstadoCasoMora        ABIERTO EN_COLA SUSPENDIDO RESUELTO CANCELADO
EstadoAvisoMora       PENDIENTE ENVIADO NO_ENTREGABLE OMITIDO_SIMULACION
MotivoCierreCasoMora  PAGO REACTIVADO CLIENTE_NO_ELEGIBLE EXCLUIDO_MANUAL CANCELADO_MANUAL CAMBIO_MODO_ZONA
EstadoLoteCorte       PENDIENTE_APROBACION APROBADO EN_EJECUCION COMPLETADO COMPLETADO_CON_PENDIENTES CANCELADO
EstadoRenglonCorte    PENDIENTE EN_PROCESO SUSPENDIDO FALLIDO BLOQUEADO_ROUTER EXCLUIDO
                      OMITIDO_PAGADO OMITIDO_NO_APLICA SIN_CUENTA_PPPOE SIMULADO
```

Índices únicos parciales (SQL a mano en la migración):
- un caso abierto por cliente (`estado IN ('ABIERTO','EN_COLA','SUSPENDIDO')`);
- un lote `CRON` por zona y fecha;
- un renglón activo por caso (`PENDIENTE`, `EN_PROCESO`, `FALLIDO`, `BLOQUEADO_ROUTER`).

### 7.6 Migraciones, en orden

| # | Commit | Contenido |
|---|---|---|
| 1 | `tareas-programadas #1` | `TareaProgramadaEjecucion` y sus enums |
| 2 | `tareas-programadas #3` | `FotoMensualCartera` e índice `IntentoAutenticacion(creadoEn)` |
| 3 | `mensajeria-cliente` | `ComunicacionCliente` y sus enums |
| 4 | `zona-facturacion` / `cliente` | Modo de corte y exclusión del corte |
| 5 | `cobranza #1` | Casos, lotes, renglones, eventos, índices parciales y llaves de `ComunicacionCliente` |

Todas aditivas. Las relaciones inversas en modelos existentes son virtuales (no crean columnas);
se revisa que el SQL solo tenga `CREATE` y `ADD COLUMN`. `RecordatorioPago` no se reutiliza.

---

## 8. Errores, API y eventos

### 8.1 Errores

- `DomainError` por módulo (`tareas-programadas.errors.ts`, `cobranza.errors.ts`); el filtro global
  responde con el contrato del estándar §7.5.
- Los procesos de fondo **nunca** dejan escapar errores por cliente o renglón: los guardan en el
  renglón o en el resumen y siguen. Solo un fallo general aborta la etapa (`FALLIDA`, se reintenta).
- Errores del motor PPPoE: se guarda su `errorCodigo` y el renglón queda `COBRANZA_PPPOE_FALLIDA`.

| Código | Tipo |
|---|---|
| `TAREA_PROGRAMADA_EN_CURSO` | CONFLICTO |
| `TAREA_PROGRAMADA_NO_MANUAL` (la tarea no admite ejecución manual) | PROHIBIDO |
| `COBRANZA_ZONA_SIN_CONFIGURACION`, `COBRANZA_PLANTILLA_NO_CONFIGURADA`, `COBRANZA_MODO_NO_PERMITIDO` | CONFLICTO |
| `COBRANZA_LOTE_ESTADO_INVALIDO`, `COBRANZA_RENGLON_ESTADO_INVALIDO`, `COBRANZA_CASO_ESTADO_INVALIDO` | CONFLICTO |
| `COBRANZA_FUERA_DE_VENTANA` (ejecutar a mano fuera de 10:00–18:00) | CONFLICTO |
| Renglón: `COBRANZA_ROUTER_SIN_RESPUESTA`, `COBRANZA_CUENTA_NO_ACTIVA`, `COBRANZA_CUENTA_AMBIGUA`, `COBRANZA_SIN_CUENTA_PPPOE`, `COBRANZA_PPPOE_FALLIDA`, `COBRANZA_OPERACION_REQUIERE_RECUPERACION` | (no son HTTP) |

### 8.2 Rutas

Listados con `{ data, meta }` (`page`, `limit`, filtros con nombre de negocio).

| Método | Ruta | Roles | Contraseña |
|---|---|---|---|
| GET | `/tareas-programadas/ejecuciones?desde=&hasta=&tarea=&estados=&facturacionZonaId=&search=&sortBy=` | `ROLES_ADMINISTRACION` | — |
| GET | `/tareas-programadas/manuales` (las que se pueden lanzar a mano) | `ROLES_ADMINISTRACION` | — |
| POST | `/tareas-programadas/:tarea/ejecutar` (solo las registradas con `registrarTareaManual`: crédito, limpiezas y recorridos; nunca jornada, foto ni cortes) | `ROLES_SUPER_ADMIN` | Sí |
| GET | `/cobranza/casos-mora` · `/cobranza/casos-mora/:id` | `ROLES_OFICINA` | — |
| POST | `/cobranza/casos-mora/:id/cancelar` | `ROLES_ADMINISTRACION` | — |
| GET | `/cobranza/lotes-corte` · `/cobranza/lotes-corte/:id` | `ROLES_OFICINA` | — |
| POST | `/cobranza/lotes-corte/:id/aprobar` | `ROLES_ADMINISTRACION` | Sí |
| POST | `/cobranza/lotes-corte/:id/cancelar` | `ROLES_ADMINISTRACION` | — |
| POST | `/cobranza/lotes-corte/:id/renglones/:renglonId/excluir` | `ROLES_ADMINISTRACION` | — |
| POST | `/cobranza/lotes-corte/:id/renglones/:renglonId/reintentar` | `ROLES_ADMINISTRACION` | Sí |
| POST · DELETE | `/internet-customer/:id/exclusion-corte` | `ROLES_ADMINISTRACION` | — |
| GET | `/internet-customer/:id/comunicaciones` | `ROLES_OFICINA` | — |
| GET | `/internet-customer/:id/historial-estado` | `ROLES_OFICINA` | — |

El modo de corte se cambia en la edición de la zona (`zona-facturacion`), solo
`ROLES_ADMINISTRACION`. Cada ruta y cada campo nuevo se anota en `cambios-contrato-ui.md`.

### 8.3 Eventos en vivo

`cobranza:lote-cambiado { loteId }` y `cobranza:caso-cambiado { casoId, clienteId }`, solo a
`ROLES_OFICINA`, anotados en `eventos-tiempo-real.md`.

---

## 9. Configuración y seguridad operativa

| Variable | Por defecto | Uso |
|---|---|---|
| `TAREAS_PROGRAMADAS_ACTIVAS` | `false` | Interruptor global de toda tarea programada. **En producción se pone `true`**; sin ella no se factura. Al arrancar apagado se escribe un aviso en el log |
| `MENSAJERIA_ENVIO_AUTOMATICO_ACTIVO` | `false` | Sin ella las comunicaciones se registran pero no salen |
| `COBRANZA_CORTE_ACTIVO` | `false` | Sin ella los lotes se arman pero ningún router se toca |
| `AVISO_MORA_PLANTILLA`, `SUSPENSION_SERVICIO_PLANTILLA`, `REACTIVACION_SERVICIO_PLANTILLA` | — | Plantillas de Meta (C14) |
| Existentes | — | `GENERACION_FACTURA_PLANTILLA`, `RECORDATORIO_FACTURA_PLANTILLA`, `RECORDATORIO_DIA_PAGO_1_PLANTILLA` y las de WhatsApp y MikroTik |

Reglas:
- Una zona no pasa a `CON_APROBACION` ni a `AUTOMATICO` sin umbral, gracia y las plantillas de mora y
  suspensión. Se valida al guardar la zona **y** al ejecutar la etapa.
- Nunca se corta a un cliente sin aviso real `ENVIADO` o `NO_ENTREGABLE`.
- Operaciones PPPoE de cobranza con `origen = COBRANZA_AUTOMATICA`.
- Logs y resúmenes: solo ids, códigos y conteos. Nada de teléfonos, nombres, usuarios PPPoE, IPs de
  routers ni respuestas de Meta.
- En local los tres interruptores quedan apagados. Las pruebas que tocan la base usan dobles de Meta
  y del router; nunca se arranca la aplicación con los interruptores encendidos.

---

## 10. Plan de trabajo

Cada commit sigue la receta de la guía de la fase legacy (§4).

| # | Commit | Qué |
|---|---|---|
| 1 | `docs #42` | Esta guía en el repositorio |
| 2 | `tareas-programadas #1` | Módulo: registro con arriendo, reintento y retoma, interruptor global, migración 1, specs |
| 3 | `tareas-programadas #2` | Jornada y repaso; los 4 crons legacy de facturación como etapas en orden (lógica sin cambios); crédito y tracking con candado y registro; tracking a los :45 |
| 4 | `tareas-programadas #3` | Limpieza (03:00) y foto mensual (00:30 del día 1), migración 2 |
| 5 | `tareas-programadas #4` | Rutas de consulta y ejecución manual |
| 6 | `mensajeria-cliente #3` | Cola de comunicaciones, envío en la ventana, migración 3 |
| 7 | `zona-facturacion`, `cliente` | Modo de corte, exclusión, historial de estado y comunicaciones del cliente, migración 4 |
| 8 | `cobranza #1` | Dominio, evaluación, avisos, lotes simulados y de solo lista, migración 5 |
| 9 | `cobranza #2` | Ejecución del corte, aprobación, exclusión, reintento y reanudación |
| 10 | `cobranza #3` | Reconciliación, evento y mensaje de reactivación |
| 11 | `ciclo-facturacion #1…` | Reemplaza `src/zona-facturacion-cron` de una vez (C24): generación por fachadas, avisos por la cola, días 29–31, `enviarAvisoPago` leído, paridad comprobada en local sin enviar; se borra el legacy |

### 10.1 Salida a producción

1. Deploy con todas las zonas en `DESACTIVADO`, `TAREAS_PROGRAMADAS_ACTIVAS=true` y los otros dos
   interruptores según se decida (§10.3 de la guía legacy).
2. Plantillas de Meta aprobadas y configuradas.
3. Una prueba de envío a un número propio.
4. Zona piloto en `SOLO_LISTA` uno o dos ciclos; comparar con lo que cobranza cortaría a mano.
5. Piloto a `CON_APROBACION`: los casos simulados se cancelan y se reabren con aviso real; el
   primer lote real sale `diasGracia` días después.
6. Por zona, `AUTOMATICO` cuando el negocio lo decida.

---

## 11. Pruebas

| Nivel | Qué cubrir |
|---|---|
| Policies | Vencida vs pendiente en la medianoche de Guatemala; `PARCIAL` cuenta; umbral exacto; gracia 0; meses de 28–31 días y cambio de año; ventana 10:00–18:00 en sus bordes |
| Entidades | Todas las transiciones válidas e inválidas de caso, lote, renglón, comunicación y ejecución |
| Casos de uso (fakes) | Arriendo: tomar, saltar lo completo, no tomar lo vigente, retomar lo abandonado, conflicto de dos que retoman; jornada en orden y que una etapa fallida no detiene las demás; ponerse al día; abrir caso y aviso juntos; aviso no entregable; pago durante la gracia; router apagado; reanudación con la misma clave; lote duplicado; exclusión; reconciliación; reactivación |
| Contra la base local | Migraciones; consultas de vencidas y elegibles; lote simulado razonable; paridad del ciclo nuevo contra el legacy. Siempre con Meta y routers sustituidos |
| Router real | Solo el dueño, con un cliente de prueba, antes de pasar una zona a modo real |

---

## 12. Futuro: promesas de pago

No se implementa ahora (C11). Idea: mientras una promesa esté vigente, el caso **no avanza** al
lote; si se cumple, se resuelve; si se incumple, sigue sin gracia extra.
`cortarDesde efectivo = max(cortarDesde, fechaLimite + 1)`. Solo afecta al corte, no a la generación
ni a los avisos. Reglas por definir: límite por cliente, quién las registra y si suspenden el aviso.

---

## 13. Glosario

| Término | Significado |
|---|---|
| **Vencida** | Factura pendiente cuya fecha de pago ya pasó (§3.1) |
| **Umbral** | `suspenderTrasFacturas` de la zona |
| **Gracia** | `diaCorte` de la zona, en días, desde el aviso de mora |
| **Caso de mora** | Seguimiento de un cliente desde que cae en mora hasta que se resuelve |
| **Lote de corte** | Lista de clientes a cortar en una zona y fecha; historial auditado |
| **Renglón** | Un cliente dentro de un lote |
| **Jornada** | La corrida diaria de las 10:00 en secuencia (§4.2) |
| **Repaso** | La revisión cada 30 min que retoma lo pendiente (§4.3) |
| **Etapa** | Paso de la jornada, registrado en `TareaProgramadaEjecucion` |
| **Arriendo** | Candado con vencimiento sobre una fila del registro (§4.4) |
| **Ventana** | 10:00 a 18:00 en Guatemala: lo único en que algo automático llega al cliente |
| **Fecha operativa** | Fecha calendario de Guatemala a la que pertenece una ejecución |
