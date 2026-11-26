# CRM NOVA (servidor) — Estándar hexagonal

> **Obligatorio.** Todo módulo nuevo se escribe así y todo módulo hexagonal existente se
> lleva a este formato. Una carpeta, archivo o patrón que no esté aquí **no se usa**.
>
> | Dato | Valor |
> |---|---|
> | Versión | 1.1 · 24-nov-2026 — aprobado por el dueño con ajustes: contrato de errores para la UI (§7.5), presenters siempre (§7.3), una empresa por BD (§4.8), `new Date()` se corrige en el camino (§5.7), listados y filtros (§7.6), ubicación y nombres de módulos (§15) |
> | Base | `43fc43b` (`refactorizaciones-hexagonales`) |
> | De dónde sale | Lo mejor de `pppoe-cliente-cuenta` (entidad, puertos, mapper), `ticket-soporte-conformidad` (transacciones), `pppoe-automatizacion` (fachada, efectos remotos) y `mikrotik-ssh` (errores), corrigiendo lo que esos mismos módulos hacen mal (§13) |
> | Prioridad | Si choca con §5 de `guia-desarrollo-cobranza-corte-crm-nova.md` o §8.3 de `guia-post-auth-refactor-hexagonal-crm-nova.md`, **manda este documento** |
> | Cambios | Cambiar una regla = editar este archivo en un commit propio, con autorización del dueño |
>
> 🆕 = pieza compartida creada en H0 (§14). **Ya existen todas** desde `refactorizacion comun #1–#5`.

---

## 1. La regla de oro

```
           dispara                       llama (a través de puertos)
 presentation ───────▶  application  ─────────────────────────────▶  infra
 (HTTP, WS, cron,       (casos de uso)                               (Prisma, SSH, Spaces,
  eventos)                   │                                        Meta, cifrado, reloj)
                             ▼                                            │
                          domain  ◀──────────── implementa los puertos ──┘
```

- **presentation** = todo lo que **dispara** un caso de uso: controladores, gateways WS,
  crons, listeners de eventos.
- **infra** = todo lo que el caso de uso **llama**: base de datos, routers, almacenamiento,
  mensajería, cifrado, reloj.
- Las dependencias apuntan **hacia adentro**. El dominio no sabe que existen Nest, Prisma,
  Express ni HTTP.

### 1.1 Qué puede importar cada capa

| Capa | Puede importar | Prohibido |
|---|---|---|
| `domain/` | Su propio `domain/`; `src/common/hexagonal/` 🆕; `public/` de otro módulo (solo tipos y enums) | `@nestjs/*`, `@prisma/client`, `express`, `dayjs`, cualquier `application/`, `infra/`, `presentation/` |
| `application/` | Su `domain/` y `application/`; `public/` de otros módulos; de `@nestjs/common` **solo** `Injectable`, `Inject`, `Logger` | `@prisma/client`, `PrismaService`, `express`, excepciones HTTP de Nest (`NotFoundException`…), `infra/`, `presentation/` |
| `infra/` | Todo lo anterior + Prisma, librerías técnicas | `presentation/`; carpetas internas de otros módulos |
| `presentation/` | `application/` (casos de uso y sus tipos), `src/auth/decoradores`, DTOs, presenters | `infra/`, `PrismaService`, entidades de otro módulo |
| Otro módulo | **Solo** `src/modules/<modulo>/public/` | Cualquier otra carpeta del módulo |

---

## 2. Árbol canónico

Estas son **todas** las carpetas permitidas. Solo se crean las que se usan (nada de
carpetas vacías). Una carpeta que no esté en esta lista está prohibida.

```
src/modules/<modulo>/
├── <modulo>.module.ts
├── public/                                  API del módulo para otros módulos (§8)
│   ├── <modulo>.facade.port.ts              interfaz + Symbol + Input/Result de la fachada
│   └── <modulo>.types.ts                    enums/tipos que otros módulos necesitan (re-export)
├── domain/
│   ├── entities/        <nombre>.entity.ts
│   ├── props/           <nombre>.props.ts
│   ├── value-objects/   <nombre>.vo.ts
│   ├── enums/           <nombre>.enum.ts
│   ├── errors/          <modulo>.errors.ts
│   ├── policies/        <nombre>.policy.ts           reglas puras que no caben en una entidad
│   ├── read-models/     <nombre>.read-model.ts
│   └── ports/           <recurso>-repository.port.ts · <recurso>-query.port.ts
├── application/
│   ├── use-cases/       <verbo>-<sustantivo>.use-case.ts
│   ├── services/        <nombre>.service.ts          orquestación compartida por ≥ 2 casos de uso
│   ├── ports/           <capacidad>.port.ts          puertos técnicos (cifrado, router, transacción…)
│   └── facade/          <modulo>.facade.ts           implementa public/<modulo>.facade.port.ts
├── infra/
│   ├── prisma/          <recurso>-prisma.repository.ts · <recurso>-prisma.query.ts
│   │                    <recurso>-prisma.mapper.ts · <modulo>-prisma.transaction.ts
│   └── <tecnologia>/    <nombre>-<tecnologia>.adapter.ts   (ssh, routeros, crypto, spaces, meta, xlsx…)
├── presentation/
│   ├── http/            <recurso>.controller.ts
│   ├── dto/             <accion>-<recurso>.dto.ts · <accion>-<recurso>-query.dto.ts
│   │                    <recurso>-response.dto.ts
│   ├── presenters/      <recurso>.presenter.ts
│   ├── ws/              <nombre>.gateway.ts
│   ├── cron/            <nombre>.cron.ts
│   └── eventos/         <nombre>.listener.ts
└── test/
    └── fakes/           <nombre>.fake.ts                    puertos falsos en memoria
```

Los `.spec.ts` van **junto al archivo que prueban** (`ppoe.entity.ts` → `ppoe.entity.spec.ts`).

**Ya no se usan:** `tokens/`, `infra/tokens/`, `application/port/` (singular),
`application/dto/`, `application/inputs/`, `application/results/`, `application/models/`,
`application/executors/`, `application/errors/`, `infraestructure/`, `interfaces/`,
`common/` dentro del módulo, `dto/` o `entities/` en la raíz del módulo, `results/`, `config/`,
`factories/`, `generators/`, `helpers/`, `utils/`. Su contenido se reubica según §2–§7.

---

## 3. Nombres

### 3.1 Módulo
- Carpeta en **kebab-case, en español**, nombre del contexto de negocio: `cliente-instalacion`,
  `zona-facturacion`, `cobranza`.
- **`pppoe` siempre con tres p.** `ppoe` es un error y se corrige al re-conformar el módulo.
- Clase del módulo: `<Modulo>Module` en `<modulo>.module.ts` (`ClienteInstalacionModule`).

### 3.2 Archivos: `<nombre>.<rol>.ts`
El último segmento antes de `.ts` dice **qué es** el archivo. Solo estos roles:

| Rol | Clase / export | Carpeta |
|---|---|---|
| `.entity.ts` | `ZonaFacturacionEntity` | `domain/entities` |
| `.props.ts` | `ZonaFacturacionProps`, `CrearZonaFacturacionProps` | `domain/props` |
| `.vo.ts` | `PeriodoFacturacion` | `domain/value-objects` |
| `.enum.ts` | `EstadoZonaFacturacion` | `domain/enums` |
| `.errors.ts` | `ZonaFacturacionNoEncontradaError` | `domain/errors` |
| `.policy.ts` | `PoliticaDiaCorte` (clase o funciones puras) | `domain/policies` |
| `.read-model.ts` | `ZonaFacturacionDetalleReadModel` | `domain/read-models` |
| `.port.ts` | `ZonaFacturacionRepositoryPort` + `ZONA_FACTURACION_REPOSITORY` | `domain/ports`, `application/ports`, `public/` |
| `.use-case.ts` | `CrearZonaFacturacionUseCase` | `application/use-cases` |
| `.service.ts` | `ResolverContextoCorteService` | `application/services` |
| `.facade.ts` | `ZonaFacturacionFacade` | `application/facade` |
| `.repository.ts` · `.query.ts` · `.mapper.ts` · `.transaction.ts` · `.adapter.ts` | `ZonaFacturacionPrismaRepository`… | `infra/…` |
| `.controller.ts` · `.dto.ts` · `.presenter.ts` · `.gateway.ts` · `.cron.ts` · `.listener.ts` | `ZonaFacturacionController`… | `presentation/…` |
| `.fake.ts` · `.spec.ts` | `ZonaFacturacionRepositoryFake` | `test/fakes`, junto al archivo |
| `.types.ts` | Tipos auxiliares de un adaptador (`ComandoRouterOsConstruido`) o re-exportes de `public/` | `infra/<tecnologia>`, `public/` |
| `.provider.ts` | Provider de configuración armado desde variables de entorno | `infra/config` |

- Nombres de negocio en **español**; roles y carpetas de capa en **inglés** (como ya está el repo).
- Un archivo = una clase principal. Nada de `.ts.ts`, espacios ni mayúsculas en nombres de archivo.

### 3.3 Tokens de inyección
- `Symbol` con el **mismo texto que la constante**, en **UPPER_SNAKE**, declarado **en el mismo
  archivo `.port.ts` que su interfaz**. En ningún otro lugar.
- Nombre = interfaz sin `Port`: `ZonaFacturacionRepositoryPort` → `ZONA_FACTURACION_REPOSITORY`.
- Nunca tokens de texto (`provide: 'ALGO'`).

### 3.4 Un tipo, un nombre
- Cada forma de datos existe **una sola vez**, en el módulo dueño. Si otro módulo la necesita, la
  importa de ese `public/`; no la copia ni la redeclara con otro nombre
  (p. ej. el material cifrado PPPoE es solo `SecretoPppoeProtegido`, de `pppoe-credentials/public/`).
- Dos tipos con el mismo nombre en archivos distintos, o dos nombres para la misma forma, se
  unifican al re-conformar el módulo.

### 3.5 Comentarios
- **Se quedan:** el JSDoc de puertos, fachadas, casos de uso y campos de DTO (Swagger lo
  publica), y los comentarios que explican un **por qué** que el código no dice (una regla de
  negocio, una limitación de RouterOS, una decisión del dueño).
- **Se van:** los que repiten el código (`/** Busca la cuenta por id. */` sobre `findById`),
  los separadores decorativos (`/* ===== */`, `/* Estado */`), las listas de "este archivo no
  conoce…", y todo código comentado (el historial está en git).
- Breves: una línea si alcanza. En español.

---

## 4. Dominio

### 4.1 Entidades

```ts
// domain/entities/zona-facturacion.entity.ts   (ejemplo ilustrativo, no es diseño de negocio)
import { ZonaFacturacionProps, CrearZonaFacturacionProps } from '../props/zona-facturacion.props';
import { ZonaFacturacionInvalidaError } from '../errors/zona-facturacion.errors';

export class ZonaFacturacionEntity {
  private constructor(private props: ZonaFacturacionProps) {}

  /** Nace nueva: valida y fija el estado inicial. */
  static create(input: CrearZonaFacturacionProps, ahora: Date): ZonaFacturacionEntity {
    const props: ZonaFacturacionProps = { id: null, ...normalizar(input), creadoEn: ahora, actualizadoEn: ahora };
    ZonaFacturacionEntity.assertConsistencia(props);
    return new ZonaFacturacionEntity(props);
  }

  /** Reconstruye desde persistencia. Valida consistencia, no reglas de creación. */
  static hydrate(props: ZonaFacturacionProps): ZonaFacturacionEntity {
    ZonaFacturacionEntity.assertConsistencia(props);
    return new ZonaFacturacionEntity({ ...props });
  }

  /** Transición: verbo de negocio, valida estado actual, recibe la fecha. */
  renombrar(nombre: string, fecha: Date): void { /* … */ this.props.actualizadoEn = fecha; }

  get id(): number | null { return this.props.id; }
  get creadoEn(): Date { return new Date(this.props.creadoEn); }   // copia defensiva

  toPrimitives(): ZonaFacturacionProps { return { ...this.props }; }
}
```

Reglas:
1. Constructor **privado**; solo `create()` (nueva), `hydrate()` (desde la BD) y, si hace falta,
   otros constructores con nombre de negocio (`adoptarExistente()`).
2. Sin setters. El estado solo cambia con **métodos de negocio** (`suspender`, `marcarActiva`)
   que validan el estado actual antes de cambiarlo.
3. **Las fechas entran como parámetro obligatorio.** Prohibido `new Date()` y prohibido
   `fecha: Date = new Date()` por defecto. El caso de uso las saca del reloj (§5.7).
4. Las violaciones de reglas lanzan un **`DomainError`** del módulo (§4.5), nunca `Error` genérico.
5. Getters de `Date` devuelven copia; `toPrimitives()` devuelve copia.
6. Una entidad no hace I/O ni conoce otras entidades por referencia: solo por id.
7. Si pasa de ~600 líneas, extraer value objects o policies.

### 4.2 Props
`domain/props/<nombre>.props.ts`: el tipo completo (`ZonaFacturacionProps`) y los de cada
constructor (`CrearZonaFacturacionProps`). Tipos planos, sin clases.

### 4.3 Value objects
Para conceptos con validación propia que se repiten (periodo, monto, usuario PPPoE, teléfono):
inmutables, `static crear(valor)` que valida, `equals()`, `valor` de solo lectura.

### 4.4 Enums
- El dominio declara **sus propios** enums (`domain/enums`), aunque Prisma tenga uno igual.
- La conversión Prisma ↔ dominio ocurre **solo en el mapper**.
- Si otro módulo necesita un enum, se re-exporta desde `public/<modulo>.types.ts`.

### 4.5 Errores de dominio 🆕
```ts
// src/common/hexagonal/domain-error.ts
export type TipoErrorDominio = 'INVALIDO' | 'NO_ENCONTRADO' | 'CONFLICTO' | 'PROHIBIDO' | 'EXTERNO';

export abstract class DomainError extends Error {
  abstract readonly codigo: string;          // estable, UPPER_SNAKE: 'ZONA_FACTURACION_NO_ENCONTRADA'
  abstract readonly tipo: TipoErrorDominio;
  constructor(mensaje: string) { super(mensaje); this.name = new.target.name; }
}

// domain/errors/zona-facturacion.errors.ts
export class ZonaFacturacionNoEncontradaError extends DomainError {
  readonly codigo = 'ZONA_FACTURACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() { super('Zona de facturación no encontrada.'); }
}
```
- Todos los errores del módulo en **un** archivo `domain/errors/<modulo>.errors.ts`.
- El filtro global los traduce a HTTP: `INVALIDO` 400 · `PROHIBIDO` 403 · `NO_ENCONTRADO` 404 ·
  `CONFLICTO` 409 · `EXTERNO` 502 (un router, Meta o Spaces no respondió), siempre con el
  contrato único de error de §7.5.
- El `mensaje` es **lo que verá el usuario**: español, claro y **sin** datos comprometedores
  (nada de ids internos, SQL, rutas, IPs de routers, usuarios PPPoE ajenos, secretos ni trazas).
- El `codigo` es **estable**: una vez publicado no se renombra (la UI decide con él).
- Los errores **técnicos** de un adaptador (como `MikrotikSshError`) viven en
  `domain/errors` del módulo dueño de esa capacidad y siguen el modelo de `mikrotik-ssh`:
  código, fase, si es reintentable y una versión segura para logs.
- `throw new Error()` en `domain/` y `application/` solo para **errores de programación**: el
  chequeo exhaustivo de un `switch` (`never`) o argumentos imposibles por contrato al construir
  un objeto técnico (p. ej. validar los props de `MikrotikSshError`). Nunca para reglas de
  negocio. En `infra/` un `Error` técnico es válido: sale como 500 genérico.

### 4.6 Policies
Reglas puras que involucran más de una entidad o datos de lectura (p. ej. "¿esta zona corta
hoy?"). Sin I/O, sin reloj (reciben la fecha), 100 % testeables.

### 4.7 Read models (datos enriquecidos)
Tipos planos de **solo lectura** para listados, detalles y reportes
(`ZonaFacturacionListItem`, `ZonaFacturacionDetalleReadModel`). Los devuelve un puerto de
consulta. Nunca se modifican ni se guardan.

- **Aquí viven los datos enriquecidos**: un read model puede traer datos de otras tablas
  (nombre del cliente, zona, router, saldo, técnico asignado) aunque pertenezcan a otro módulo.
- **Lectura sí, escritura no:** el adaptador de consulta (`-prisma.query.ts`) puede hacer
  `select`/`include` sobre tablas de otros módulos **solo para leer**. Escribir en la tabla de
  otro módulo se hace siempre a través de su fachada (§8).
- Valores calculados de negocio (días de mora, saldo pendiente, puede suspenderse) se calculan
  en el adaptador de consulta o en una policy de dominio, **no** en el presenter.
- Sin N+1: una consulta con `select` explícito, o una segunda consulta por lote (`in: ids`).

### 4.8 Puertos de persistencia (`domain/ports`)
Dos puertos por agregado, como en `pppoe-cliente-cuenta`:

| Puerto | Trabaja con | Métodos típicos |
|---|---|---|
| `<recurso>-repository.port.ts` | La **entidad** | `create`, `update`, `findById`, búsquedas que el caso de uso necesita para **modificar** |
| `<recurso>-query.port.ts` | **Read models** | `findMany(filtros)` paginado, `findDetail(params)` |

```ts
export const ZONA_FACTURACION_REPOSITORY = Symbol('ZONA_FACTURACION_REPOSITORY');

export interface ZonaFacturacionRepositoryPort {
  /** Persiste una zona nueva. */
  create(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity>;
  /** Persiste los cambios hechos con los métodos de la entidad. */
  update(entity: ZonaFacturacionEntity): Promise<ZonaFacturacionEntity>;
  findById(id: number): Promise<ZonaFacturacionEntity | null>;
}
```
- **Una empresa por base de datos.** `empresaId` **no** es un filtro de seguridad y los puertos
  nuevos no lo reciben para buscar. Si una tabla exige `empresaId` al insertar, el caso de uso lo
  recibe en el `Input` (el controlador lo toma del actor). Los filtros por `empresaId` que ya
  existen en módulos viejos no se quitan a propósito: se van limpiando al re-conformar.
- JSDoc en cada método: qué garantiza y qué no.
- Tipos de parámetros con nombre (`BuscarZonaParams`) en el mismo archivo del puerto.

---

## 5. Aplicación

### 5.1 Casos de uso

```ts
// application/use-cases/renombrar-zona-facturacion.use-case.ts
export type RenombrarZonaFacturacionInput = { usuarioId: number; zonaId: number; nombre: string };
export type RenombrarZonaFacturacionResult = { zonaId: number; nombre: string };

@Injectable()
export class RenombrarZonaFacturacionUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_REPOSITORY) private readonly zonas: ZonaFacturacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: RenombrarZonaFacturacionInput): Promise<RenombrarZonaFacturacionResult> {
    const zona = await this.zonas.findById(input.zonaId);
    if (!zona) throw new ZonaFacturacionNoEncontradaError();

    zona.renombrar(input.nombre, this.reloj.ahora());
    const guardada = await this.zonas.update(zona);

    return { zonaId: guardada.id!, nombre: guardada.nombre };
  }
}
```

Reglas:
1. **Una clase por acción**, nombre `<Verbo><Sustantivo>UseCase`, un único método público
   `execute(input)`.
2. `Input` y `Result` son **tipos planos declarados en el mismo archivo**. Si otro módulo los
   necesita, se mueven a `public/`.
3. Recibe quién actúa (`usuarioId`) **como dato del input**. Nunca `req`, nunca un DTO.
4. Depende **solo de puertos** (`@Inject(TOKEN)`), nunca de un repositorio Prisma concreto ni
   de un caso de uso de **otro** módulo (para eso está la fachada, §8).
5. Lanza `DomainError`; **nunca** `NotFoundException` ni otras excepciones HTTP.
6. **No recibe ni valida el rol** (eso es `@Roles` en el controlador): el `Input` no lleva
   `actorRol`. Sí valida la **pertenencia** cuando depende de los datos ("solo el técnico
   asignado"), con un `DomainError` de tipo `PROHIBIDO`. No repite validaciones de forma que ya
   hace el DTO.
7. Si pasa de ~300 líneas, extraer policies (dominio) o services (aplicación).

### 5.2 Services (`application/services`)
Solo para orquestación **interna** reutilizada por ≥ 2 casos de uso del mismo módulo (como
`PppoeOperacionStepRunnerService`). Nunca un `<Modulo>Service` con CRUD genérico: eso es el
legacy que estamos quitando.

### 5.3 Puertos técnicos (`application/ports`)
Capacidades que no son persistencia del agregado: cifrado, router, almacenamiento, envío de
mensajes, transacciones de intención. Interfaz + `Symbol` en el mismo archivo. La
implementación vive en `infra/<tecnologia>/`.

### 5.4 Validación: quién valida qué

| Qué | Dónde |
|---|---|
| Forma y formato de la entrada HTTP (tipos, longitudes, enums, requeridos) | DTO en `presentation/dto` (pipe global estricto) |
| Invariantes del concepto (estado válido, transiciones, rangos de negocio) | Entidad / value object |
| Reglas que cruzan agregados o necesitan datos (existe, pertenece a la empresa, no hay duplicado) | Caso de uso o policy |
| Rol del usuario ("solo oficina puede…") | `@Roles(...GRUPO)` en el controlador |
| Pertenencia ("solo el técnico asignado…") | Caso de uso o policy, `DomainError` `PROHIBIDO` |
| Contraseña para operaciones sensibles | `@OperacionSensible()` en el controlador |

### 5.5 Transacciones
- `$transaction` **solo en `infra/prisma`**.
- Si un caso de uso necesita guardar varias cosas de forma atómica, se declara un **puerto de
  intención** en `application/ports/<modulo>-transaction.port.ts` con métodos de negocio
  (`persistirFirmaCliente(input)`), como en `ticket-soporte-conformidad`. Nada de pasar
  `tx` ni `Prisma.TransactionClient` fuera de infra.
- Concurrencia: si dos escrituras pueden pisarse, la implementación usa `updateMany` con
  condición de estado/versión y lanza un `DomainError` de tipo `CONFLICTO` si no afectó filas.
- **Atomicidad entre módulos: unidad de trabajo** 🆕. Cuando un caso de uso necesita escribir de
  forma atómica en tablas de **otros** módulos, no entra a sus entidades ni mappers: inyecta
  `UNIDAD_DE_TRABAJO` (`src/common/transaccion/unidad-de-trabajo.port.ts`) y llama a las
  fachadas dentro de `ejecutar(() => …, { aislamiento? })`. Los repositorios Prisma leen el
  cliente de `PrismaTransaccional.cliente` (no `PrismaService` directo) para unirse a la
  transacción abierta; fuera de una unidad se comportan igual que antes. Dentro de `ejecutar`
  no hay I/O remoto (SSH, Meta, Spaces). El puerto de intención (`<modulo>-transaction.port.ts`)
  sigue siendo la opción cuando todas las tablas son del propio módulo.

### 5.6 Efectos externos (MikroTik, WhatsApp, Spaces)
Patrón del step runner de `pppoe-automatizacion`, obligatorio para todo lo que toca el mundo
real:
1. **Primero se persiste** la intención/paso (`EJECUTANDO`); si eso falla, no se toca nada remoto.
2. Se ejecuta la acción remota de forma **idempotente** (verificar antes de crear/cambiar).
3. Se persiste el resultado (éxito/fallo) con respuesta **sanitizada**.
4. Existe un caso de uso de **recuperación** para pasos que quedaron `EJECUTANDO`.
5. Nunca se guardan ni se registran contraseñas, secretos PPPoE, comandos completos ni stdout.

### 5.7 Tiempo 🆕
- Puerto `RELOJ` (`src/common/reloj/reloj.port.ts`): `ahora(): Date` y
  `fechaOperativa(): string` (`YYYY-MM-DD` en `America/Guatemala`).
- Los casos de uso piden la hora al reloj y la pasan a la entidad.
- `new Date()` solo existe en el adaptador del reloj y en los mappers (para convertir valores de la BD).
- En pruebas se usa `RelojFijo` 🆕.
- **Se corrige en el camino:** el reloj se crea en H0 y se usa desde el primer módulo nuevo. Los
  `new Date()` de módulos existentes se reemplazan cuando ese módulo se re-conforma o se toca,
  no en un commit masivo.

### 5.8 Logs
`private readonly logger = new Logger(<Clase>.name)`. Solo ids, códigos y duraciones. Nunca
correos, teléfonos, DPI, contraseñas, tokens, secretos PPPoE ni cuerpos de petición.

---

## 6. Infraestructura

### 6.1 Prisma
| Archivo | Responsabilidad |
|---|---|
| `<recurso>-prisma.repository.ts` | `implements <Recurso>RepositoryPort`. Lee/escribe y devuelve **entidades** vía el mapper |
| `<recurso>-prisma.query.ts` | `implements <Recurso>QueryPort`. `select` explícito, paginación, devuelve **read models** |
| `<recurso>-prisma.mapper.ts` | Clase con métodos estáticos: `toDomain(record)`, `toCreatePersistence(entity)`, `toUpdatePersistence(entity)`. Único lugar donde se convierten enums y fechas |
| `<modulo>-prisma.transaction.ts` | Implementa el puerto de intención con `$transaction` |

Reglas:
- Los tipos de `@prisma/client` **no salen de `infra/`**.
- Errores conocidos de Prisma (`P2002` duplicado, `P2025` no encontrado) se traducen aquí al
  `DomainError` que corresponda. Cualquier otro error de Prisma sale como 500 genérico (§7.5).

### 6.2 Otros adaptadores
`infra/<tecnologia>/<nombre>-<tecnologia>.adapter.ts`, `implements` un puerto de
`application/ports`. Errores de la librería se normalizan antes de salir del adaptador.

---

## 7. Presentación

### 7.1 Controladores (`presentation/http`)

```ts
@ApiTags('zonas-facturacion')
@Controller('zonas-facturacion')
export class ZonaFacturacionController {
  constructor(private readonly renombrarZona: RenombrarZonaFacturacionUseCase) {}

  @Patch(':zonaId/nombre')
  @Roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN)
  async renombrar(
    @Param('zonaId', ParseIntPipe) zonaId: number,
    @Body() dto: RenombrarZonaFacturacionDto,
    @Actor() actor: ActorHttp,                       // 🆕
  ) {
    const result = await this.renombrarZona.execute({
      usuarioId: actor.usuarioId, zonaId, nombre: dto.nombre,
    });
    return ZonaFacturacionPresenter.renombrada(result);
  }
}
```

Reglas:
1. **Delgado:** extraer actor y parámetros → `execute` → presenter. Sin lógica, sin `try/catch`,
   sin Prisma.
2. **Sin** `@UseGuards(JwtAuthGuard)` ni `@UsePipes(new ValidationPipe(...))`: el guard y el
   pipe globales ya actúan.
3. Autorización con `@Roles(...GRUPO)`, usando los grupos con nombre de
   `src/auth/roles/grupos-roles.ts` (`ROLES_OFICINA`, `ROLES_TECNICO`); un grupo nuevo se agrega
   ahí, no se escribe la lista en el controlador. El 403 es el genérico del guard ("No tiene
   permisos para esta operación.", `codigo: PROHIBIDO`). Al quitar una validación de rol de un
   caso de uso, **toda** ruta que llegue a él recibe su `@Roles` en el mismo commit.
   Operaciones que piden contraseña con `@OperacionSensible()`. Endpoints públicos con
   `@Public()` **más** su propia protección.
4. El actor sale de `@Actor()` 🆕 (usuario, empresa, rol, IP desde `req.ip`, user-agent).
   **Prohibido** leer `x-forwarded-for` a mano o declarar tipos `AuthenticatedRequest` locales.
5. Parámetros numéricos con `ParseIntPipe`/`ParseUUIDPipe`.
6. Nombre de clase `<Recurso>Controller`; un controlador por recurso, no por caso de uso.

### 7.2 DTOs (`presentation/dto`)
- **Solo existen en presentación.** Nunca se pasan al caso de uso: el controlador los
  convierte en `Input`.
- `<accion>-<recurso>.dto.ts` → `<Accion><Recurso>Dto`; filtros de listado
  `listar-<recurso>-query.dto.ts` → `Listar<Recurso>QueryDto`.
- Todo campo con decorador de `class-validator`. Sin conversión implícita: `@Type(() => Number)`
  para números de query, `@Transform` explícito para booleanos.
- Comentario `/** */` en cada campo (el plugin de Swagger lo publica).
- `PartialType`/`PickType`/`OmitType` desde `@nestjs/swagger`.
- DTOs de respuesta: `<recurso>-response.dto.ts` → `<Recurso>ResponseDto`. Son el tipo que
  devuelve el presenter (§7.3) y lo que Swagger documenta. Sin decoradores de validación.

### 7.3 Presenters: el mapeador hacia la UI (`presentation/presenters`)
**Toda respuesta pasa por un presenter.** Es el único lugar donde se decide qué ve la UI, así
que ajustar una respuesta es cambiar un archivo.

```ts
// presentation/dto/zona-facturacion-response.dto.ts   → forma pública (Swagger la documenta)
export class ZonaFacturacionResponseDto {
  /** Id de la zona */      id: number;
  /** Nombre visible */     nombre: string;
  /** Clientes activos */   clientesActivos: number;
}

// presentation/presenters/zona-facturacion.presenter.ts
export class ZonaFacturacionPresenter {
  static item(m: ZonaFacturacionListItem): ZonaFacturacionResponseDto {
    return { id: m.id, nombre: m.nombre, clientesActivos: m.clientesActivos };
  }
  static listado(r: ResultadoPaginado<ZonaFacturacionListItem>): RespuestaPaginada<ZonaFacturacionResponseDto> {
    return presentarPaginado(r, ZonaFacturacionPresenter.item);   // 🆕 helper común
  }
}
```

Reglas:
1. Lista **blanca**: el presenter copia campo por campo. Nunca `return entidad`,
   `return registroPrisma` ni `...spread` de un read model: así un campo nuevo en la BD
   (o un secreto) no se filtra solo.
2. Nunca expone: hashes, secretos cifrados (`secretoCifrado`, `secretoIv`…), tokens, datos de
   otras sesiones, campos internos de auditoría que la pantalla no usa.
3. Fechas como ISO 8601 (`toISOString()`); fechas de negocio sin hora como `YYYY-MM-DD`.
   Montos como `number`, igual que hoy.
4. Formato de presentación (etiquetas, agrupaciones para la pantalla) sí va aquí; cálculos de
   negocio no (§4.7).
5. **Refactorizar mejora el contrato.** Al pasar una ruta existente a hexagonal, su respuesta
   adopta el formato estándar (paginación `{ data, meta }`, nombres claros, fechas ISO, sin
   campos internos): la UI solo pinta lo que recibe y se ajusta en consecuencia. Cada cambio
   visible se anota en `docs/cambios-contrato-ui.md` en el mismo commit.
6. Si dos pantallas necesitan formas distintas, son dos métodos del presenter
   (`item`, `detalle`, `opcion`), no dos casos de uso.

### 7.4 Crons, gateways y listeners
`presentation/cron`, `presentation/ws`, `presentation/eventos`: igual de delgados que un
controlador. Un cron solo decide **cuándo** y llama a un caso de uso; el candado y el registro de
ejecución los dará `tareas-programadas` (H4).

### 7.5 Contrato único de error hacia la UI 🆕
Toda respuesta de error del servidor (HTTP) tiene **la misma forma**, venga de donde venga:

```json
{
  "statusCode": 409,
  "codigo": "CUENTA_PPPOE_ESTADO_INVALIDO",
  "message": "No se puede suspender una cuenta que no está activa.",
  "campos": [{ "campo": "nombre", "mensajes": ["nombre no debe estar vacío"] }],
  "requestId": "0b6c9e0e-…"
}
```

| Campo | Siempre | Para qué lo usa la UI |
|---|---|---|
| `statusCode` | Sí | Igual que hoy |
| `codigo` | Sí | **Decidir qué hacer** (`switch`): refrescar sesión, marcar campos, mostrar aviso |
| `message` | Sí, **siempre texto** | Mostrarlo tal cual al usuario |
| `campos` | Solo en `VALIDACION` | Pintar el error junto a cada input |
| `requestId` | Sí | Mostrar "Código de soporte: …" y buscarlo en los logs (también va en la cabecera `X-Request-ID`) |

Códigos genéricos (los pone el filtro cuando el error no trae uno propio):

| HTTP | `codigo` | Origen |
|---|---|---|
| 400 | `VALIDACION` | ValidationPipe; `message` = "Hay datos inválidos en la solicitud." y el detalle en `campos` |
| 400 | `SOLICITUD_INVALIDA` | Otro `BadRequest` |
| 401 | `NO_AUTENTICADO` | Guard JWT / sesión (auth podrá afinar: `TOKEN_EXPIRADO`, `SESION_REVOCADA`) |
| 403 | `PROHIBIDO` | `@Roles`, permisos |
| 404 | `NO_ENCONTRADO` | |
| 409 | `CONFLICTO` | |
| 410 | `ENDPOINT_RETIRADO` | `@EndpointRetirado()` |
| 429 | `DEMASIADOS_INTENTOS` | Throttler |
| 500 | `ERROR_INTERNO` | Todo lo no controlado: `message` genérico, **nunca** el error real |
| 502 | `SERVICIO_EXTERNO` | `DomainError` de tipo `EXTERNO` sin código propio |

Reglas de seguridad:
1. El detalle real (stack, error de Prisma, salida SSH) va **solo al log**, con el `requestId`.
2. Un 500 jamás lleva el mensaje original. `EXPONER_DETALLE_ERRORES` sigue siendo solo local.
3. Los `DomainError` traen su propio `codigo` y un `message` escrito para el usuario (§4.5).
4. Las `HttpException` de código legacy conservan su `message` (son textos escritos a mano),
   reciben un `codigo` genérico por su status y, si `message` era un arreglo, se convierte a texto.
5. Errores de WebSocket: mismo `codigo` y `message` dentro del evento de error.

**Cambio visible para el front:** hoy los 400 de validación traen `message` como arreglo; con
este contrato pasa a texto y el detalle se mueve a `campos`. Registrado en
`docs/cambios-contrato-ui.md`.

### 7.6 Listados y filtros de tablas
Toda tabla con paginación del servidor sigue este flujo:

```
Listar<Recurso>QueryDto ──▶ Listar<Recurso>Input ──▶ <Recurso>QueryPort.findMany(filtros)
 (presentation/dto)          (use case)               (domain/ports; infra/prisma/*.query.ts)
        ▲                                                         │
        └── RespuestaPaginada<ResponseDto> ◀── Presenter ◀── ResultadoPaginado<ListItem>
```

**Contrato HTTP (el que ya usan los listados PPPoE, no cambia):**
- Query: `page` (desde 1), `limit` (máx. 100), `search`, `sortBy`, `sortDir` (`asc`/`desc`) y los
  filtros propios del recurso con nombres de negocio (`estado`, `zonaId`, `desde`, `hasta`).
- Respuesta: `{ data: [...], meta: { total, page, limit, totalPages } }`.

Piezas comunes (creadas en H0, `refactorizacion comun #3`):
- `src/common/hexagonal/paginacion.ts`: `Paginacion`, `ResultadoPaginado<T>` (`items`, `total`,
  `page`, `limit`: lo devuelve el puerto), `RespuestaPaginada<T>` (`{ data, meta }`: lo devuelve el
  controlador), `normalizarPaginacion()` (por defecto `page` 1 y `limit` 10, máximo 100),
  `aDesplazamiento()` (`skip`/`take`, solo en infra), `crearResultadoPaginado()` y
  `presentarPaginado(resultado, Presenter.item)`.
- `src/common/http/paginacion-query.dto.ts`: `PaginacionQueryDto` (`page`, `limit`, `search`
  recortado, `sortDir`).
- `src/common/http/transformaciones-query.ts`: `@ComoArreglo()`, `@ComoBooleano()`, `@Recortar()`.
- Reemplazan a `src/Utils/pagination.ts` y `src/shared/application/page/Pagination.ts` (se
  retiran cuando sus usuarios se re-conforman).

Reglas:
1. `Listar<Recurso>QueryDto extends PaginacionQueryDto` y agrega sus filtros. `sortBy` es un
   **enum** con las columnas permitidas de ese recurso.
2. Los filtros viajan como un tipo `<Recurso>Filtros` declarado junto al read model del listado
   (`domain/read-models/<recurso>-listado.read-model.ts`).
3. El adaptador de consulta arma el `where` en un método privado `construirWhere(filtros)` y el
   orden con un **mapa** `sortBy → orderBy` de Prisma. Nunca se pasa texto del usuario
   directo a `orderBy` ni a SQL.
4. `findMany` y `count` en la misma `$transaction` para que `total` cuadre con `data`.
5. Filtros de varios valores: `?estados=ACTIVO&estados=SUSPENDIDO`, normalizados a arreglo con
   `@Transform` y validados con `@IsEnum(Enum, { each: true })`.
6. Rangos de fechas: `desde`/`hasta` como `YYYY-MM-DD`; el adaptador los interpreta como días
   completos en `America/Guatemala` (`>= desde 00:00` y `< hasta+1 00:00`).
7. `search`: se recorta; busca con `contains`/`insensitive` solo en columnas declaradas en el
   adaptador.
8. **El mismo `<Recurso>Filtros` sirve para la tabla y para su exportación a Excel**: la
   exportación llama al mismo puerto (sin paginar o por lotes), no repite filtros.
9. Contadores para pestañas o badges (cuántos por estado con los filtros actuales): método
   aparte del puerto de consulta, `contarPorEstado(filtros)`.
10. Opciones para los combos de filtros (zonas, sectores, routers): endpoint liviano
    `GET <recurso>/opciones-filtro`, con su propio presenter `opcion()`.

---

## 8. API pública y relación entre módulos

1. Lo **único** que otro módulo puede importar es `src/modules/<modulo>/public/`, más su
   `<modulo>.module.ts` (solo desde otro `.module.ts`, para el `imports: []` de Nest).
2. `public/<modulo>.facade.port.ts` contiene la interfaz de la fachada, su `Symbol` y los tipos
   `Input`/`Result` que usa. Ejemplo existente: `PPPOE_PROVISIONAMIENTO`. Un módulo que ofrece
   **una capacidad técnica** (cifrar, abrir una sesión SSH) publica directamente ese puerto:
   `public/<capacidad>.port.ts` (ej. `mikrotik-router-credentials/public/mikrotik-router-secret-cipher.port.ts`),
   implementado por un adaptador de su `infra/`.
3. La fachada la implementa `application/facade/<modulo>.facade.ts`, que delega en los casos
   de uso. Se registra con `{ provide: TOKEN, useExisting: <Modulo>Facade }`.
4. `public/<modulo>.types.ts` re-exporta los enums y read models que otros módulos necesitan.
5. El `@Module` **exporta solo tokens de `public/`**: nunca clases de casos de uso, servicios
   ni repositorios.
6. **Prohibido** registrar en `providers` una clase de otro módulo.
7. **Sin ciclos** entre módulos. Si A necesita a B y B a A: uno de los dos expone un puerto que
   el otro implementa, o se publica un evento.
8. Lo transversal sin dueño de negocio vive en `src/common/` (reloj, errores base).

---

## 9. El módulo Nest

```ts
@Module({
  imports: [PrismaModule, OtroModuloModule /* solo por su token público */],
  controllers: [ZonaFacturacionController],
  providers: [
    // Casos de uso
    CrearZonaFacturacionUseCase,
    RenombrarZonaFacturacionUseCase,
    // Fachada
    ZonaFacturacionFacade,
    { provide: ZONA_FACTURACION_FACADE, useExisting: ZonaFacturacionFacade },
    // Adaptadores
    { provide: ZONA_FACTURACION_REPOSITORY, useClass: ZonaFacturacionPrismaRepository },
    { provide: ZONA_FACTURACION_QUERY, useClass: ZonaFacturacionPrismaQuery },
  ],
  exports: [ZONA_FACTURACION_FACADE],
})
export class ZonaFacturacionModule {}
```
- Providers agrupados y en este orden: casos de uso → services → fachada → adaptadores.
- `AuthModule` no se importa: guard, roles y step-up son globales.
- Sin `forwardRef`.

---

## 10. Pruebas
- Toda **entidad**, **value object** y **policy** tiene `.spec.ts` con sus transiciones válidas
  e inválidas.
- Todo **caso de uso** con reglas tiene `.spec.ts` con puertos falsos de `test/fakes/` y
  `RelojFijo`. Sin Nest `TestingModule`: se instancia la clase con `new`.
- Adaptadores Prisma y controladores: verificación con la lista de humo hasta que exista una BD
  de pruebas.
- Correr con `npm test`.

---

## 11. Legacy → hexagonal (strangler)
El objetivo no es solo mover código a hexagonal: es dejar el módulo **completo** profesional
(estructura, datos que devuelve, formatos, errores). La UI solo pinta.

1. Crear el módulo nuevo en `src/modules/<modulo>/` con este formato.
2. Ruta por ruta (o grupo pequeño), el endpoint pasa a un controlador del módulo nuevo con
   respuesta **estándar**: listados paginados `{ data, meta }` (§7.6), recursos vía presenter
   (§7.3), errores con el contrato de §7.5.
3. Las **rutas** se conservan salvo que la legacy sea claramente mala (verbo equivocado,
   `delete-all`, nombre confuso); en ese caso se propone la nueva al dueño antes de cambiarla.
4. Todo cambio visible para la UI (ruta, campo, forma, código de error) se registra en
   `docs/cambios-contrato-ui.md` en el mismo commit.
5. Cuando no queda ninguna ruta en el módulo legacy, se borra.
6. Un commit por ruta o grupo pequeño: `refactorizacion <modulo> #N`.

---

## 12. Checklist de conformidad

Un módulo está **conforme** cuando todos estos comandos (Git Bash, desde la raíz del repo)
devuelven vacío. Se corre al terminar cada paso y se pega el resultado en el commit.

**Script:** `bash scripts/conformidad-hexagonal.sh <modulo>` corre todas las comprobaciones
(las de abajo más "otros módulos que entran en este" y "entidades sin spec").

```bash
export LC_ALL=C.UTF-8
M=src/modules/<modulo>; N=<modulo>

# 1. Dominio puro
grep -rlE "from '@nestjs|from '@prisma|PrismaService|from 'express'|from 'dayjs'" $M/domain
# 2. Aplicación sin Prisma, sin Express, sin excepciones HTTP
grep -rlE "from '@prisma|PrismaService|from 'express'|[A-Za-z]+Exception\b" $M/application
grep -rnP "from '@nestjs/(?!common')" $M/domain $M/application
# 3. No se entra a carpetas internas de otros módulos
grep -rnP "from '(src/modules/|(\.\./)+)(?!$N/)[a-z-]+/(domain|application|infra|infraestructure|presentation|tokens|dto)/" $M
# 4. Tokens solo en archivos .port.ts
grep -rn "Symbol(" $M | grep -v "\.port\.ts:"
# 5. Tiempo solo vía reloj
grep -rn "new Date()" $M/domain $M/application
# 6. Errores: solo DomainError (revisar a mano los que sean chequeo exhaustivo `never`)
grep -rn "throw new Error(" $M/domain $M/application
# 7. Presentación sin guards/pipes locales ni IP manual
grep -rlE "x-forwarded-for|UsePipes|UseGuards\(JwtAuthGuard|new ValidationPipe|AuthenticatedRequest" $M
# 8. Sin código muerto
find $M -name '*.ts' -empty; grep -rlE "This action (adds|returns)" $M; find $M -name '*.ts.ts'
# 9. Sin carpetas fuera del árbol canónico (comparar con §2)
find $M -type d | sed "s|$M||" | sort
# 10. Sin `ppoe`
find $M -name '*ppoe*' | grep -v pppoe
```
Además: `npm run build` en verde, `npm run lint:check` sin subir la línea base, `npm test` con
los specs del módulo en verde y existe `.spec.ts` para cada entidad.

---

## 13. Estado actual de los módulos hexagonales (medido en `43fc43b`)

Resultado de las comprobaciones de §12 (número de archivos o líneas que fallan). **Ningún
módulo cumple hoy al 100 %.**

| Módulo | Dominio impuro | App con Prisma/HTTP | Entra en otros módulos | Tokens fuera de `.port` | `new Date()` | `throw new Error` | Guards/pipes/IP manual | Muertos | Specs |
|---|---|---|---|---|---|---|---|---|---|
| `pppoe-automatizacion` | 0 | 19 | **206** | 0 | 3 | 15 | 6 | 1 | 0 |
| `cliente-instalacion` | 0 | 9 | 73 | 2 | 8 | 42 | 1 | **11** | 0 |
| `cliente-desinstalacion` | 1 | 19 | 51 | 5 | 13 | 42 | 1 | 0 | 0 |
| `pppoe-cliente-cuenta` | 0 | 4 | 24 | 2 | 15 | 23 | 1 | 2 | 0 |
| `real-time-location` | 0 | 8 | 13 | 4 | 6 | 25 | 1 | 1 | 0 |
| `pppoe-auditoria` | 0 | 2 | 12 | 1 | 1 | 14 | 2 | 0 | 0 |
| `pppoe-perfil-homologacion` | 0 | 5 | 11 | 1 | 4 | 5 | 1 | 0 | 0 |
| `pppoe-operacion` | 0 | 9 | 10 | 0 | 5 | **109** | 0 | 1 + un `.ts.ts` | 0 |
| `ticket-soporte-conformidad` | 0 | 7 | 8 | 0 | 15 | 32 | 2 | **9** | 0 |
| `pppoe-acceso-internet` | 0 | 0 | 0 | 1 | 9 | 7 | 0 | 6 | 0 |
| `digital-ocean-media` | 1 | 2 | 0 | 7 | 3 | 9 | 0 | 1 | 0 |
| `excel-reports` | 2 | 4 | 2 | 0 | 8 | 2 | 1 | 2 | 0 |
| `mikrotik-ssh` | 0 | 0 | 2 | 1 | 0 | 5 | 1 | 1 | 0 |
| `ticket-soporte-historial` | 0 | 0 | 1 | 0 | 1 | 2 | 1 | 0 | 0 |
| `pppoe-credentials` | 0 | 0 | 1 | 0 | 1 | 2 | 0 | 1 | 0 |
| `ppoe-instalacion-acceso` | 0 | 0 | 0 | 1 | 1 | 3 | 0 | 1 | 0 |
| `mikrotik-router-credentials` | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `reports` | 0 | 0 | 0 | 2 | 0 | 0 | 1 | **10** | 0 |
| `pppoe-instalacion-acceso` | Carpeta huérfana: un solo archivo, todo comentado | | | | | | | | |

Además, ningún módulo tiene `public/`, la estructura de carpetas de casi todos se sale de §2 y
hay ciclos de tipos entre `pppoe-cliente-cuenta`, `pppoe-auditoria`, `pppoe-operacion` y
`pppoe-automatizacion`.

### 13.1 Orden para re-conformarlos
Primero los módulos de los que dependen otros, para que su `public/` exista cuando se ajuste a
sus consumidores:

| Tanda | Módulos | Nota |
|---|---|---|
| C0 ✅ | Arreglos rápidos en todos: IP desde `req.ip`, borrar código muerto y archivos vacíos, quitar guards/pipes redundantes | **Hecho** en `refactorizacion conformidad #1–#5`: 8 lecturas de `x-forwarded-for` → `req.ip`; 97 archivos inalcanzables borrados (incluida la carpeta huérfana `pppoe-instalacion-acceso/`); `.ts.ts` renombrado; guards JWT y `ValidationPipe` locales fuera de 16 controladores. Lint 410 → 368. El paso a `@Actor()` y `new Date()` van en C1–C5 |
| C1 ✅ | `mikrotik-ssh`, `mikrotik-router-credentials`, `pppoe-credentials`, `digital-ocean-media` → **`almacenamiento-media`** | **Hecho**: `mikrotik-router-credentials #1–#2`, `pppoe-credentials #1–#3`, `mikrotik-ssh #1–#3`, `almacenamiento-media #1–#4` (renombre, fachada `ALMACENAMIENTO_MEDIA`, `@Actor()` en `/media`). Lint 368 → 361 |
| C2 ✅ | `pppoe-auditoria`, `pppoe-operacion`, `pppoe-acceso-internet`, `pppoe-perfil-homologacion`, `pppoe-cliente-cuenta` | **Hecho**: fachadas `PPPOE_AUDITORIA`, `PPPOE_ACCESO_INTERNET`, `PPPOE_PERFIL_HOMOLOGACION`, `PPPOE_CLIENTE_CUENTA` y `PPPOE_OPERACION` con read models; errores de dominio, `RELOJ`, `hydrate()`, `@Actor()`, presenters y `@Roles(ROLES_OFICINA)` en escrituras de oficina; specs de entidades y fachadas con fakes. Pendiente para C3: el motor de `pppoe-automatizacion` aún usa los casos de uso, entidades y repositorio de `pppoe-operacion` (exportados como temporales), la persistencia de adopción escribe con entidades de acceso/cuenta/auditoría, y los puertos de `pppoe-operacion` todavía reciben `empresaId`. Lint 361 → 344 |
| C3 ✅ | `pppoe-automatizacion` | **Hecho** en `refactorizacion pppoe-automatizacion #1–#15` (+ `comun #6–#7`, `docs #8`): estructura §2, el motor usa solo fachadas (`PPPOE_OPERACION`, `PPPOE_CLIENTE_CUENTA`, `PPPOE_ACCESO_INTERNET`, `PPPOE_AUDITORIA`), 273 excepciones HTTP → `DomainError`, `@Actor()` y `@Roles(ROLES_OFICINA)` en todas las acciones, `RELOJ`, presenters, adopción atómica con la unidad de trabajo, `SincronizacionLocalPppoeService` compartido por ejecución y recuperación (la recuperación ahora sincroniza acceso y cliente), policies de efecto remoto y contexto de eliminación, specs del step runner, ejecución, recuperación y adopción (40). Pendiente: la adopción y el contexto de ejecución leen el router con puertos internos del legacy `src/mikro-tik` (se resuelve al rehacer `mikrotik-router`); los `Input` públicos de prealta/provisionamiento aún llevan `empresaId` (C4). Lint 344 → 342 |
| C4 ✅ | `cliente-instalacion`, `cliente-desinstalacion` | **Hecho** en `refactorizacion cliente-instalacion #1–#3` y `cliente-desinstalacion #1–#3` (+ `comun #8`: `Money` a `src/common/hexagonal`): estructura §2, `ppoe-instalacion-acceso` fusionado en `cliente-instalacion`, puerto de repositorio y de consulta separados con read models planos (`resumirInstalacion`, `resumirDesinstalacion`), `DomainError`, `RELOJ`, `@Actor()`, `@Roles` (oficina decide, técnico ejecuta), presenters con `presentarPaginado`, creación, aprobación y rechazo atómicos con la unidad de trabajo (la prealta y la baja PPPoE van fuera de la transacción), reautenticación por puerto, `public/cliente-instalacion.types.ts`, specs con fakes (127 y 85 pruebas). Pendiente: la entidad `ClienteDesinstalacionEntity` sigue en ~950 líneas (extraer una policy de consistencia) y varios use cases de PPPoE de C3. Lint 342 → 329 |
| C5 | `ticket-soporte-historial`, `ticket-soporte-conformidad`, `real-time-location`, `excel-reports` | Independientes |
| — | `reports` (casi vacío) | Decidir con el dueño: borrar, fusionar o renombrar (`ppoe-instalacion-acceso` se fusionó en C4 y `pppoe-instalacion-acceso` se borró en C0) |

Reglas al re-conformar: respuestas al formato estándar (los listados PPPoE ya usan
`{ data, meta }`), cambios visibles anotados en `docs/cambios-contrato-ui.md`, un commit por tipo de
cambio dentro del módulo (mover tokens, errores de dominio, reloj, fachada, carpetas), y
verificar con §12 al final.

---

## 14. Piezas compartidas (H0 — terminado)

Todas creadas y con pruebas en `refactorizacion comun #1–#5`. La de ESLint queda pendiente
(opcional).

| Pieza | Ubicación | Qué es |
|---|---|---|
| `DomainError` | `src/common/hexagonal/domain-error.ts` | Clase base de §4.5 |
| Contrato único de error | `src/common/excepciones/filtro-global-excepciones.ts` | §7.5: `codigo` siempre, `message` siempre texto, `campos` en validación, `requestId`; traduce `DomainError` |
| `campos` de validación | `src/common/validacion/validacion-global.pipe.ts` | El pipe entrega los errores por campo para que el filtro arme `campos` |
| Paginación común | `src/common/hexagonal/paginacion.ts` + `src/common/http/paginacion-query.dto.ts` | §7.6 |
| `RELOJ` + adaptador + `RelojFijo` | `src/common/reloj/` (módulo global) | §5.7; el adaptador usa `src/Utils/dayjs.config.ts` |
| `@Actor()` + `ActorHttp` | `src/auth/decoradores/actor.decorator.ts` | Lee `UsuarioAutenticado` de `req.user` e IP de `req.ip` |
| Unidad de trabajo | `src/common/transaccion/` (módulo global) | §5.5: `UNIDAD_DE_TRABAJO` + `PrismaTransaccional` (AsyncLocalStorage). Agregada en C3 (`refactorizacion comun #6`) |
| (Opcional) reglas de ESLint | `eslint.config.mjs` | `no-restricted-imports` por capa para que §1.1 lo vigile el lint. Sin dependencias nuevas |

---

## 15. Dónde viven los módulos y cómo se llaman

1. **Todo módulo hexagonal vive en `src/modules/`.** Un módulo legacy se queda donde está hasta
   que se refactoriza; al terminar, el módulo nuevo está en `src/modules/<nombre>` y la carpeta
   legacy se borra.
2. Estado final de `src/`: `main.ts`, `app.module.ts`, `auth/`, `common/`, `prisma/`,
   `swagger/` y `modules/`. `Utils/`, `shared/` y `CustomDecoratorAuthToken/` se absorben en
   `common/` o en el módulo que las use.
3. `src/modules/` es **plano** (sin subcarpetas por grupo). Las familias se agrupan por
   **prefijo**: `pppoe-*`, `ticket-soporte-*`, `cliente-*`, `mikrotik-*`.
4. Nombre: el contexto de negocio en **singular**, en español y kebab-case (`cliente`, `pago`,
   `zona-facturacion`). Si el contexto es un proceso, el sustantivo del proceso
   (`facturacion`, `cobranza`, `mensajeria-cliente`). Nada de nombres de proveedor
   (`twilio`, `digital-ocean`): el proveedor es un adaptador en `infra/`.
5. **Fusionar** al refactorizar: varias carpetas legacy del mismo contexto terminan en un solo
   módulo.

### 15.1 Propuesta de nombres (se confirma al empezar cada módulo)

| Legacy (`src/…`) | Módulo nuevo (`src/modules/…`) | Nota |
|---|---|---|
| `cliente-internet` | `cliente` | Paso H3. Trae el dominio que ya existe en `cliente-internet/domain` |
| `facturacion`, `factura-eliminacion` | `facturacion` | |
| `facturacion-zona` | `zona-facturacion` | Paso H5 |
| `zona-facturacion-cron` | `ciclo-facturacion` | Paso H11 |
| `banrural-integration` + pagos de `facturacion` y `ruta-cobro` | `pago` | Paso H12; Banrural es un adaptador |
| `ruta-cobro` | `ruta-cobro` | |
| `credito` | `credito` | Ya es parcialmente hexagonal |
| `tickets-soporte`, `ticket-resumen`, `ticket-seguimiento`, `ticket-soluciones`, `tags-ticket`, `bot-functions` | `ticket-soporte` | Se suma a los `ticket-soporte-*` que ya existen |
| `metas-tickets`, `metricas-tickets` | `ticket-soporte-metrica` | |
| `whatsapp-template`, `cloud-api-meta`, `whatsapp-api-meta`, `whatsapp-campaigns`, `twilio*`, `mensaje`, `broadcast` | `mensajeria-cliente` | Paso H6; Meta y Twilio como adaptadores |
| `notificaciones`, `notificaciones-usuario`, `push-notifications`, `push-dispositivos` | `notificacion` | |
| `user`, `perfil-usuario`, `perfil` | `usuario` | Sin tocar `auth` |
| `contrato-cliente`, `id-contrato` | `contrato-cliente` | |
| `servicio`, `servicio-internet`, `tipo-servicio` | `servicio` | |
| `sector`, `empresa`, `location` | `sector`, `empresa`, `ubicacion` | CRUD pequeños |
| `mikro-tik`, `customer-network-config`, `network-service`, `olt` | `mikrotik-router` | Junto a `mikrotik-ssh` y `mikrotik-router-credentials` |
| `ssh-mikrotik-connection` | — | Corte legacy por IP: se retira cuando todo esté en PPPoE (G3) |
| `generate-reports` + `modules/excel-reports` + `modules/reports` | `reporte` | |
| `dashboard` | `dashboard` | Módulo solo de lectura (sin `entities/`, solo puertos de consulta) |
| `real-time-location` (legacy) | `modules/real-time-location` | Ya existe la versión hexagonal; decidir si el legacy se borra |
| `web-sockets` | `common/tiempo-real` | Transversal, no es negocio |
| `open-ia`, `fireworks-ia` | `asistente-ia` | Baja prioridad |
| `customer-payload` | — | Sus importaciones ya responden 410; candidato a borrar |

Los módulos hexagonales actuales conservan su nombre salvo `ppoe-instalacion-acceso` (error de
escritura), `pppoe-instalacion-acceso` (huérfano) y `reports` (casi vacío), que se resuelven en
C0/C1. `digital-ocean-media` ya se renombró a `almacenamiento-media` (C1).
