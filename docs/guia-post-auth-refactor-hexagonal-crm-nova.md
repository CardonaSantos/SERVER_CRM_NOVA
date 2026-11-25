# CRM NOVA (servidor) — Cierre de la etapa auth + majors y guía para el refactor hexagonal

> **Para quién es:** para el dueño (qué cambió y cuánta seguridad hay hoy) y para el
> **siguiente chat de Claude Code** (cómo seguir con las refactorizaciones hexagonales).
>
> | Dato | Valor |
> |---|---|
> | Repo | `CardonaSantos/SERVER_CRM_NOVA` |
> | Producción (`main`) | `108c6ef` — merge PR #29 `refinaciones-septiembre-ii` (30-sep-2026) |
> | Rama de trabajo `refactorizaciones-hexagonales` | `43fc43b` |
> | Rama de puntos de control `checkpoints-refactorizaciones` | `43fc43b` (**idéntica** a la anterior) |
> | Diferencia `main → 43fc43b` | 45 commits, 176 archivos, +8 824 / −4 255 líneas (5 117 de ellas son `package-lock.json`) |
> | Análisis | 24-nov-2026, **solo lectura**: sin checkout sobre ramas remotas, sin commits, sin push. No se compiló ni se ejecutó (la sesión no tiene red para `npm ci`); todo sale de leer el código y los mensajes de commit |
>
> Documentos hermanos del proyecto: `guia-auth-majors-crm-nova.md` (plan de la etapa que
> aquí se cierra), `contexto-backend-crm-nova-corte.md` (radiografía de `main`),
> `guia-desarrollo-cobranza-corte-crm-nova.md` (plan del corte y del refactor hexagonal),
> `diseno-corte-morosos-crm-nova.md`, `guia-migracion-angular-crm-nova.md`.

---

## 0. Resumen ejecutivo

1. **La etapa auth + majors está terminada en código, pero NO está en producción.**
   `main` sigue en `108c6ef`. Todo lo de este documento vive solo en las ramas de trabajo.
2. **Versiones:** NestJS 10 → **12.6**, TypeScript 5.1 → **6.0**, Node sin fijar →
   **Node 24** (`engines ^24.9.0` + `.nvmrc`), ESLint 8 → **10** (flat config), Jest 29 → **30**,
   Express 4 → **5** (vía Nest 11+). Passport y helmet **eliminados**. Swagger instalado.
3. **Autenticación global:** guard global (`APP_GUARD`) en modo **estricto por defecto**: toda
   ruta HTTP exige JWT salvo las marcadas `@Public()`. Un controlador nuevo **nace protegido**.
4. **Sesiones reales:** access token JWT de **20 min** + refresh token opaco rotativo guardado
   como SHA-256; sesión en BD consultada **en cada petición** → logout, revocación y desactivar
   usuario cortan el acceso al instante (también los sockets).
5. **Validación global:** `ValidationPipe` global **estricto por defecto** (`transform` +
   `whitelist` + `forbidNonWhitelisted`) y **sin conversión implícita de tipos**.
6. **Autorización por rol:** existe `RolesGuard` global + `@Roles(...)`, pero **solo se usa en 6
   rutas** (gestión de usuarios y `regist-user`). El resto de la API: cualquier usuario
   autenticado puede usarla.
7. **Step-up (reautenticación):** 8 operaciones sensibles (cortes, reactivaciones, bajas,
   provisionamiento PPPoE, autorizaciones) con `@OperacionSensible()`.
8. **Contraseñas:** scrypt (`node:crypto`) con migración automática desde bcrypt en el login.
9. **Errores:** filtro global; los 500 ya no exponen stack ni mensajes internos.
10. **Antes de desplegar** hay cambios de contrato para el front y el Android, variables de entorno
    nuevas obligatorias y una migración aditiva (§6).

---

## 1. Ramas y commits

### 1.1 Estado de las ramas

```
main                          108c6ef  ← producción (no tocar)
  └─ c533939  Checkpoint servidor a migrar claude code (20-nov)
     └─ 4a32754  docs: guía de etapa auth y majors + CLAUDE.md
        └─ … 43 commits numerados …
           └─ 43fc43b  refactorizacion auth #27   ← refactorizaciones-hexagonales
                                                   ← checkpoints-refactorizaciones (mismo commit)
```

Las dos ramas de trabajo apuntan al **mismo commit**: el último punto de control coincide con
la punta del trabajo. Hay además ramas viejas (`octubre`, `refinaciones-*`, `feature/credito`)
que no forman parte de esta etapa.

> `c533939` agregó **solo** un dominio inicial de cliente (`src/cliente-internet/domain/`:
> entidad, props, enums y puerto de repositorio) que **todavía no está conectado** a ningún
> módulo. Es el primer paso del refactor hexagonal de clientes (§8, paso H3).

### 1.2 Commits por tema (en orden)

| Tema | Commits | Qué hicieron |
|---|---|---|
| **tooling** | #1 `lint:check` · #2 `.gitattributes` (eol=lf) · #3 Node 22 · #4 Jest resuelve `src/...` · #5 Node 24 | Herramientas y reproducibilidad |
| **auth etapa 1** (parche sobre Nest 10) | #1 instala helmet + throttler · #2 cierra `regist-user` · #3 JWT expiran (12 h provisional) · #4 helmet + trust proxy · #5 límite de intentos · #6 `JwtAuthGuard` en 9 controladores peligrosos · #7 borra `prisma.controller.ts` · #8 quita credenciales/correos/tokens de logs · #9 quita datos personales de logs · #10 guard en reportes y rutas de cobro | Cerrar lo urgente |
| **upgrade** | #1 query parser `extended` · #2 Nest 10 → 11 · #3 Nest 11 → 12 + TS 6 · #4 helmet → `useSecurityHeaders()` · #5 ESLint 8 → 10 · #6 archivos con espacio en el nombre | Majors, de uno en uno |
| **auth etapa 3** | #11 quita Passport: `JwtAuthGuard` propio | D3 |
| **swagger** | #1 OpenAPI con `@nestjs/swagger` 12.1.2 · #2 `PartialType` desde swagger | Documentación |
| **auth etapa 7** | #12 migración aditiva · #13 scrypt · #14 sesiones + refresh · #15 revocación cierra sockets · #16 guard global en observación · #17 `RolesGuard` · #18 step-up · #19 `ValidationPipe` en observación · #20 filtro global de excepciones | Auth completo |
| **auth etapa 8** | #21 endpoints masivos → 410 · #22 gestión de usuarios (dueño o SUPER_ADMIN) · #23 firma de Meta y bot · #24 guard global **estricto** por defecto · #25 guard de secreto interno · #26 DTOs legacy listos · #27 `ValidationPipe` **estricto** por defecto | Cerrar y encender |

Convención usada: `refactorizacion <tema> #N`, un propósito por commit. Cada mensaje de commit
trae lo que se verificó (casos N/N). **Esos scripts de verificación no están en el repo**: se
corrieron en local y solo queda el registro en el mensaje.

---

## 2. Cambios de plataforma (majors y configuración)

### 2.1 Dependencias

| Paquete | `main` | Ahora | Nota |
|---|---|---|---|
| `@nestjs/common`, `core`, `platform-express`, `platform-socket.io`, `websockets`, `testing` | 10.4 | **12.6.0** | Paquetes ESM; la app sigue en **CommonJS** y los consume vía `require(esm)` |
| `@nestjs/cli` / `schematics` | 10 | 12.0.15 / 12.0.16 | |
| `@nestjs/schedule` | 4.1 | 12.0.4 | La 4 no soporta Nest 11+ |
| `@nestjs/config` / `axios` / `jwt` | 4 / 4 / 11 | 12.1.1 / 12.0.2 / 12.0.5 | |
| `@nestjs/swagger` | — | **12.1.2** | Nuevo |
| `@nestjs/throttler` | — | **6.8.0** | Nuevo |
| `@nestjs/mapped-types` | `*` | (transitiva de swagger) | `PartialType` ahora se importa de `@nestjs/swagger` en 65 DTOs |
| `@nestjs/passport`, `passport`, `passport-jwt` | sí | **eliminados** | |
| `helmet` | — | instalado y luego **eliminado** | Reemplazado por `app.useSecurityHeaders()` de Nest 12 |
| `typescript` | 5.1 | **6.0.3** | La 7 aún no la soportan Nest ni typescript-eslint |
| `eslint` | 8.57 | **10.15** | Flat config `eslint.config.mjs`; `.eslintrc.js` borrado |
| `typescript-eslint` | `@typescript-eslint/*` 7 | paquete único **8.74** | |
| `jest` / `@types/jest` | 29 | **30** | `ts-jest` 29.4.15 |
| `@types/node` | 20 | **24.19** | |
| `@types/express` | 4.17 | **5.0.6** | Express 5 |
| `bcryptjs` | sí | sí | Solo dentro de `PasswordService` para verificar hashes heredados |

### 2.2 Configuración

| Archivo | Cambio |
|---|---|
| `package.json` | `engines.node: ^24.9.0`; script `lint:check` (sin `--fix`); los scripts de test se invocan con `node --experimental-vm-modules node_modules/jest/bin/jest.js` (Jest necesita eso para cargar los paquetes ESM de Nest 12); `jest.moduleNameMapper` `^src/(.*)$` |
| `.nvmrc` | `24` |
| `.gitattributes` | `* text=auto eol=lf`; `.xlsx` como binario |
| `tsconfig.json` | `"strict": false` explícito (TS 6 lo activa por defecto) y `"types": ["node","jest","multer"]` (TS 6 pone `[]`) |
| `nest-cli.json` | Plugin `@nestjs/swagger` con `introspectComments`: los esquemas salen de los tipos, de los decoradores de class-validator y de los comentarios `/** */` de los DTOs |
| `eslint.config.mjs` | Traducción 1:1 de la config vieja. **Línea base de lint: 410 errores preexistentes** (última medición, commit #27); la regla es no superarla |
| Imports `src/...` | **Se mantienen** (decisión del dueño). Nest CLI 12 los reescribe al compilar; Jest los resuelve con el `moduleNameMapper` |
| Archivos con espacio | `CloseTicketDto .dto.ts` → `close-ticket.dto.ts`; los otros dos se borraron (nadie los importaba) |

### 2.3 Arranque (`src/main.ts`)

```ts
NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })   // Meta firma los bytes exactos
app.useSecurityHeaders({ crossOriginResourcePolicy: { policy: 'cross-origin' } })  // = defaults de Helmet 8
app.set('trust proxy', 1)              // Railway: req.ip = IP real del cliente (lo necesita el throttler)
app.set('query parser', 'extended')    // Express 5 trae 'simple'; sin esto se rompen zonas[]=1&zonas[]=2
app.enableCors({ allowlist de 4 orígenes, credentials: true, … })   // sin cambios
configurarSwagger(app)                 // solo si SWAGGER_HABILITADO=true
```

### 2.4 Lo global registrado en `app.module.ts`

| Pieza | Mecanismo | Dónde |
|---|---|---|
| `GuardGlobalAuth` | `APP_GUARD` | `auth/auth.module.ts` |
| `RolesGuard` | `APP_GUARD` (corre después del anterior) | `auth/auth.module.ts` |
| `ValidacionGlobalPipe` | `APP_PIPE` | `common/validacion/validacion.module.ts` |
| `FiltroGlobalExcepciones` | `APP_FILTER` | `common/excepciones/excepciones.module.ts` |
| `JwtModule` | `global: true`, HS256 fijo al firmar y verificar, `expiresIn` 20 min | `auth/auth.module.ts` |
| `SesionesModule` | Módulo global (lo usan el guard y el gateway WS) | `auth/sesiones/` |
| `PasswordModule` | Módulo global | `auth/password/` |
| `ThrottlerModule.forRoot(...)` | **No** es guard global: solo actúa donde se usan los decoradores `LimitarIntentos*` | `auth/throttling/auth-throttling.ts` |

### 2.5 Base de datos

Una sola migración, **aditiva**: `prisma/migrations/20261123201951_auth_sesiones_refresh_intentos`.

| Objeto | Para qué |
|---|---|
| `enum PlataformaSesion { WEB, ANDROID }` | Política de duración por cliente |
| `SesionUsuario` (id UUID) | Una por login. Su id viaja en el JWT como `sid`. Doble TTL (`expiraInactividadEn` deslizante, `expiraAbsolutaEn` fijo), `revocadaEn` + `motivoRevocacion`, `instalacionId` para Android. FK a `Usuario` con `ON DELETE CASCADE` |
| `RefreshToken` | Solo `tokenHash` SHA-256 (único), `usadoEn` para detectar reutilización, `reemplazadoPorId` (cadena de rotación) |
| `IntentoAutenticacion` | Bitácora de LOGIN / REFRESH / REAUTENTICACION: éxito, motivo, IP, user-agent; el correo solo como hash |

No toca ninguna tabla existente. Se generó con `migrate diff` y se aplicó en local con
`migrate deploy` (sin drift según el commit #12).

---

## 3. Cuánta autenticación y autorización hay ahora

### 3.1 La respuesta corta

**Sí, es global.** Hoy el servidor tiene **cinco capas**, de afuera hacia adentro:

| Capa | ¿Global? | Alcance real |
|---|---|---|
| **0. Endurecimiento HTTP** (cabeceras, CORS, trust proxy, filtro de errores) | Sí | Toda la app |
| **1. Autenticación JWT + sesión en BD** | **Sí, por omisión** (`APP_GUARD`, estricto) | Toda ruta HTTP salvo `@Public()` |
| **2. Validación de entrada** (`ValidationPipe` estricto) | **Sí** (`APP_PIPE`) | Todo `@Body()`/`@Query()`/`@Param()` tipado con una clase DTO |
| **3. Autorización por rol** (`@Roles`) | El guard es global; **el uso es opt-in** | **6 rutas** |
| **4. Step-up / reautenticación** (`@OperacionSensible`) | Opt-in | **8 rutas** |
| **+ Límite de intentos** (throttler) | Opt-in | login, refresh, reautenticar y las 8 sensibles |

Comparado con `main`: allí había **0 capas globales**, 72 de 87 controladores sin guard, JWT
eternos, `regist-user` público y DTOs que no validaban nada.

### 3.2 Capa 1 — Autenticación (cómo funciona una petición)

```
Petición HTTP
  │
  ├─ GuardGlobalAuth (APP_GUARD)
  │    ├─ ¿contexto no-HTTP (WS)? → pasa (el gateway valida su propio handshake)
  │    ├─ ¿@Public() en el handler o la clase? → pasa
  │    └─ JwtAuthGuard.canActivate():
  │          1. Authorization: "Bearer <token>" (mismo formato que aceptaba passport-jwt)
  │          2. jwtService.verifyAsync  → firma HS256 + vencimiento       (falla → 401 "Unauthorized")
  │          3. construirUsuarioAutenticado → exige exp, id/sub válido y sid (falla → 401 con mensaje)
  │          4. sesionesService.validarSesionActiva(sid, userId) → consulta a BD
  │             (revocada, expirada o usuario inactivo → 401 "La sesión expiró o fue revocada.")
  │          5. req.user = { …, rol/activo/empresaId LEÍDOS DE LA BD }, marca "ya autenticado"
  │
  ├─ RolesGuard (APP_GUARD) → solo si la ruta tiene @Roles(...)
  ├─ Guards de ruta (@UseGuards(JwtAuthGuard) → no repite la consulta; ThrottlerGuard; SecretoInternoGuard; EndpointRetiradoGuard)
  ├─ Interceptores (StepUpInterceptor en @OperacionSensible)
  ├─ Pipes (ValidacionGlobalPipe estricto → luego los ValidationPipe locales que existan)
  └─ Handler
```

Modo del guard global (variable `AUTH_GUARD_MODO`):
- **sin variable o cualquier otro valor → `estricto`** (401). Falla cerrado.
- `observacion` → no rechaza; registra `[observación] rechazaría MÉTODO /ruta (motivo)`
  deduplicado. Solo para diagnóstico. Las rutas con `@UseGuards(JwtAuthGuard)` y las de
  `@Roles` rechazan igual.

`req.user` conserva **todos** los campos que ya consumían los controladores (`id`, `sub`,
`userId`, `nombre`, `correo`, `rol`, `activo`, `empresaId`) y agrega `sesionId`, `amr` y
`authTime`.

Los 29 archivos que todavía tienen `@UseGuards(JwtAuthGuard)` explícito siguen funcionando: es
redundante con el guard global, no dañino.

### 3.3 Sesiones y tokens

| Parámetro | WEB | ANDROID |
|---|---|---|
| Access token (JWT) | 20 min | 20 min |
| Vida de cada refresh | 7 días | 30 días |
| Inactividad (deslizante) | 3 días | 30 días |
| Tope absoluto desde el login | 14 días | 90 días |

Archivo: `src/auth/sesiones/sesion.constants.ts`. Claims del JWT: `sub`, `id`, `nombre`,
`correo`, `rol`, `activo`, `empresaId`, `sid`, `amr` (`['pwd']` o `['pwd','reauth']`),
`auth_time`, `iat`, `exp`.

**Rotación y robo:** cada `POST /auth/refresh` canjea el refresh (una sola vez, atómico) por un
par nuevo. Si un refresh **ya canjeado** reaparece:
- dentro de 30 s → se trata como carrera benigna (dos pestañas): se rechaza, no se revoca;
- después → **reutilización**: se revoca la sesión completa (`REUTILIZACION_REFRESH`).

**Revocación** (motivos en `MOTIVO_REVOCACION`): `LOGOUT`, `REVOCADA_POR_USUARIO`,
`CERRAR_OTRAS`, `REUTILIZACION_REFRESH`, `USUARIO_INACTIVO`. Toda revocación emite
`EVENTO_SESIONES_REVOCADAS`; el gateway WS cierra esos sockets con `{ code: 'SESSION_REVOKED' }`.
Desactivar un usuario (`updateUser`, `updateOneUser`, `deactivateUser`) revoca todas sus
sesiones.

**Login sin enumeración de cuentas:** la contraseña se verifica antes de mirar `activo`; si el
correo no existe se verifica contra un hash de relleno (mismo tiempo de respuesta).

### 3.4 Endpoints de auth

| Método | Ruta | Acceso | Notas |
|---|---|---|---|
| POST | `/auth/login-user` | `@Public` + límite | Body: `correo`, `contrasena` (≥ 8), `plataforma?` (`WEB`/`ANDROID`), `instalacionId?` (obligatorio en ANDROID). Respuesta: `{ access_token, refresh_token, token_type, expires_in, user }` |
| POST | `/auth/refresh` | `@Public` + límite | Body `{ refresh_token }` |
| POST | `/auth/reautenticar` | JWT + límite | Body `{ contrasena }` → access token de la **misma** sesión con `amr ['pwd','reauth']`, vigente 5 min para operaciones sensibles |
| POST | `/auth/logout` | JWT | Revoca la sesión actual |
| GET | `/auth/sesiones` | JWT | Sesiones vigentes; `actual` marca la de la petición |
| POST | `/auth/sesiones/cerrar-otras` | JWT | |
| DELETE | `/auth/sesiones/:id` | JWT | `ParseUUIDPipe`; solo sesiones propias |
| POST | `/auth/regist-user` | JWT + `@Roles(SUPER_ADMIN)` | Ya **no** devuelve el access token del usuario creado |
| GET | `/auth/profile` | JWT | Contrato del Android |

### 3.5 Capa 2 — Validación ("parsers")

| Pieza | Qué hace |
|---|---|
| `ValidacionGlobalPipe` (`APP_PIPE`) | Modo por `VALIDACION_MODO`; **sin variable → estricto**: `transform: true`, `whitelist: true`, `forbidNonWhitelisted: true`. Un campo no declarado en el DTO → **400**. `observacion` solo registra nombres de campo y regla (nunca valores) |
| **Sin `enableImplicitConversion`** | Decisión del dueño (se aparta de la guía original): rompía en silencio 8 `@Transform` existentes (`"false"` llegaba como `true`, p. ej. desactivar un usuario lo dejaba activo) y convertía `""` en `0`. **Toda conversión de tipo va explícita en el DTO** con `@Type(() => Number)` o `@Transform` |
| `ValidationPipe` locales | 28 controladores siguen con el suyo; corren **después** del global |
| Query parser `extended` | Express 5 cambió a `simple`; se fijó `extended` (qs) para arreglos con corchetes y objetos anidados |
| `rawBody: true` | Necesario para la firma HMAC del webhook de Meta |
| `ParseUUIDPipe` | En `DELETE /auth/sesiones/:id` |
| DTOs legacy | El commit #26 corrigió los DTOs que el modo estricto habría roto, alineados con los payloads reales del front (de 166 DTOs, 133 sin observaciones). **Los 21 DTOs vacíos de scaffold del CLI responden 400** en estricto si reciben campos (sus servicios no hacen nada) |

### 3.6 Capa 3 — Autorización por rol

`@Roles(...RolUsuario)` + `RolesGuard` global. El rol sale **de la BD** en cada petición (no
del token), así que cambiar el rol de alguien aplica al instante. Una ruta con `@Roles` exige
usuario aunque el guard global esté en observación. Respuesta: 403 *"No tiene permisos para
esta operación."*

**Uso actual (6 rutas):**
- `POST /auth/regist-user` → SUPER_ADMIN.
- `user.controller`: crear usuario, activar, desactivar, restaurar, borrar perfil → SUPER_ADMIN.
- `PUT /user/user-profile/:id` y `PUT /user/update-user-profile/:id`: SUPER_ADMIN edita a
  cualquiera; el resto **solo su propio perfil** y no puede cambiar `rol` ni `activo` (403).
  Antes, un TÉCNICO podía hacerse SUPER_ADMIN o cambiar la contraseña de otro.

**Todo lo demás no tiene restricción de rol.** Cualquier usuario con sesión (incluido un
técnico) puede, por ejemplo, borrar pagos, editar facturas, editar zonas o usar el corte legacy
por IP. La asignación de roles al resto quedó como **decisión de negocio pendiente** (§7).

### 3.7 Capa 4 — Step-up (reautenticación) y límites de intentos

`@OperacionSensible({ campoContrasena? })` = límite de reautenticación + `StepUpInterceptor`.
**Camino doble** (transición pedida por el dueño):
- Con un token de `/auth/reautenticar` de hace ≤ 5 min → **no** hace falta mandar la contraseña.
- Sin él → se exige en el body como antes (`contrasenaActual`, o `password` en autorizar).

El contexto viaja por `AsyncLocalStorage` (solo vale para ese usuario y esa petición). Lo
honran `AuthService.reautenticarUsuarioPorId` y el adaptador de reautenticación de operador
PPPoE. El valor marcador que pone el interceptor **no es una credencial**: fuera de un step-up
vigente se verifica como contraseña y falla.

| Ruta con `@OperacionSensible` | Módulo |
|---|---|
| `PATCH …/autorizaciones/:id/aprobar` | cliente-desinstalacion |
| `POST …/:instalacionId/pppoe/activar` | cliente-instalacion |
| `POST pppoe-cuentas/:id/suspender` · `/reactivar` · `/dar-de-baja` | pppoe-automatizacion |
| `POST pppoe-cuentas/:id/provisionar` | pppoe-automatizacion |
| `POST pppoe-operaciones/:id/autorizar` · `/reintentar` | pppoe-automatizacion |

**Throttler** (en memoria, válido con una sola instancia), dos contadores:

| Endpoint | Por IP | Por identidad |
|---|---|---|
| login | 20/min | 5/min por IP+correo, bloqueo 5 min |
| refresh | 60/min | 60/min |
| reautenticar y las 8 sensibles | 20/min | 10/min por usuario, bloqueo 5 min |

### 3.8 Endpoints públicos (sin JWT) y cómo se protegen

| Ruta | Protección propia |
|---|---|
| `GET /` (`app.controller`) | Ninguna (salud) |
| `POST /auth/login-user`, `POST /auth/refresh` | Throttler |
| `GET /whatsapp-meta/webhook` | `WHATSAPP_VERIFY_TOKEN` en tiempo constante; falla cerrado si falta |
| `POST /whatsapp-meta/webhook` | Firma `X-Hub-Signature-256` = HMAC-SHA256(body crudo, `META_APP_SECRET`); sin firma válida → 403. `send-test` **no** es público |
| `POST /crm-bot-functions/create-ticket` | `@RequiereSecretoInterno()`: cabecera `x-internal-secret` = `INTERNAL_SECRET`, en un guard (antes de validar el body), tiempo constante, falla cerrado |
| `POST /internal/server/broadcast` (Nuvia → sockets) | Igual que el bot. Integración que no estaba en el inventario original; su body es una interfaz y no se valida a propósito |
| `ticket-soporte-conformidad/public/:token` (GET, `retrabajo`, `firma`) | Token del enlace |

### 3.9 Endpoints retirados (410 Gone)

`@EndpointRetirado()` responde 410 desde un guard: la lógica sigue en el código pero no se
ejecuta. Reactivar uno exige quitar el decorador en su propio commit.
`DELETE internet-customer/delete-all`, `facturacion/delete-all-march`, `ruta-cobro/delete-all`,
`tickets-soporte/delete-all`, `credito/delete-all`,
`credito-cliente-expediente/delete-all-archivo`, `cliente-instalaciones/delete-all`,
`GET location/delete-all`, `GET customer-payload/importar-excel` e `importar-csv`.

### 3.10 Capa 0 — Endurecimiento y errores

- **Cabeceras:** `app.useSecurityHeaders()` (CSP, HSTS, COOP, X-Frame-Options… = Helmet 8), CORP
  `cross-origin`.
- **Filtro global de excepciones:** 4xx y 501–599 idénticos a Nest. Los **500** se registran con
  stack, método, ruta, usuario y `requestId`; al cliente llega
  `{ statusCode, message, errorCode, requestId }` + cabecera `X-Request-ID`, nunca stack ni
  `details`. Respeta un `X-Request-ID` válido del cliente. `EXPONER_DETALLE_ERRORES=true` agrega
  `detalle` (solo local). WS usa `BaseWsExceptionFilter`.
- **Logs:** sin correos, tokens, payloads de JWT, datos personales de clientes, cuerpos del
  webhook ni teléfonos destino.
- **WebSocket** (`/ws`): exige `exp` y `sid` con sesión vigente en BD; códigos `TOKEN_EXPIRED`,
  `SESSION_INVALID`, `SESSION_REVOKED`; rol y empresa salen de la BD.
- **Swagger:** `/docs` y `/docs/json`, **apagado por omisión** (solo con
  `SWAGGER_HABILITADO=true`), Bearer `jwt` como requisito global. 359 operaciones, 151 esquemas.

### 3.11 Huecos que siguen abiertos (no son regresiones; es lo que falta)

| # | Hueco | Gravedad |
|---|---|---|
| G1 | **Roles solo en 6 rutas.** Un usuario autenticado de cualquier rol puede hacer casi todo (pagos, facturas, zonas, borrados unitarios, corte legacy) | 🔴 |
| G2 | ~~Aislamiento por empresa~~ **Cerrado (24-nov):** una empresa por base de datos; `empresaId` no es filtro de seguridad (estándar §4.8) | ✅ |
| G3 | `POST ssh-mikrotik-connection/suspend-customer` y `activate-customer` (corte legacy por IP) reciben la contraseña en el body **sin** `@OperacionSensible` ni límite de intentos | 🟠 |
| G4 | `banrural-integration` exige JWT desde el commit auth #6. **Confirmar quién lo llama:** si es el banco directo, los pagos Banrural dejan de entrar al desplegar | 🟠 (bloqueante de deploy si aplica) |
| G5 | Throttler en memoria: correcto solo con **una** instancia (C13) | 🟡 |
| G6 | Nadie limpia `SesionUsuario`, `RefreshToken` ni `IntentoAutenticacion` vencidos: crecen sin límite | 🟡 |
| G7 | No se validan variables de entorno al arrancar (`ConfigModule.forRoot` sin esquema). Si falta `MY_SECRET_TOKEN_KEY_CRM` no truena al inicio; los secretos de Meta/bot fallan cerrado por endpoint | 🟡 |
| G8 | ~~Formato de error~~ **Cerrado (24-nov, `refactorizacion comun #2`):** contrato único `{statusCode, codigo, message, campos?, requestId}` para todas las rutas (estándar §7.5; cambios en `docs/cambios-contrato-ui.md`) | ✅ |
| G9 | Sin red de pruebas automatizadas: Jest corre, pero 11 de 15 suites siguen siendo boilerplate roto; las verificaciones de la etapa no quedaron en el repo | 🟡 |

---

## 4. Flujos que cambiaron (para el front y el Android)

### 4.1 Login → uso → refresh

```
Cliente                                   Servidor
  │ POST /auth/login-user {correo, contrasena, plataforma?, instalacionId?}
  │────────────────────────────────────────▶ verifica (scrypt o bcrypt→rehash), crea SesionUsuario
  │◀──────── {access_token(20 min, sid), refresh_token, token_type, expires_in, user}
  │
  │ GET /lo-que-sea  Authorization: Bearer access
  │────────────────────────────────────────▶ JWT + sesión en BD → 200
  │
  │ (a los 20 min) → 401
  │ POST /auth/refresh {refresh_token}
  │────────────────────────────────────────▶ canje único + rotación
  │◀──────── {access_token nuevo, refresh_token nuevo, …}
  │ reintenta la petición original
```

El front debe: guardar el refresh, interceptar el 401, refrescar **una sola vez** aunque haya
varias peticiones en vuelo (si no, la segunda es "reutilización" y fuera de 30 s revoca la
sesión), y mandar al login si el refresh falla.

### 4.2 Operación sensible con step-up

```
POST /auth/reautenticar {contrasena}  → access token con amr ['pwd','reauth'] (5 min)
POST /pppoe-cuentas/:id/suspender      → sin contrasenaActual en el body (o con ella, camino viejo)
```

### 4.3 Socket

Conectar con el access token vigente. Ante `TOKEN_EXPIRED` o `SESSION_INVALID`: refrescar y
reconectar. Ante `SESSION_REVOKED`: cerrar sesión en el cliente.

---

## 5. Inventario de archivos nuevos (src)

```
src/auth/JwtGuard/guard-global-auth.ts        GuardGlobalAuth (APP_GUARD, estricto/observación)
src/auth/JwtGuard/jwt-auth.guard.ts           JwtAuthGuard propio (reescrito, sin Passport)
src/auth/JwtGuard/jwt-payload.ts              JwtPayload, UsuarioAutenticado, construirUsuarioAutenticado
src/auth/JwtGuard/roles.guard.ts              RolesGuard (APP_GUARD)
src/auth/decoradores/public.decorator.ts      @Public()
src/auth/decoradores/roles.decorator.ts       @Roles(...)
src/auth/dto/refresh.dto.ts, reautenticar.dto.ts
src/auth/password/password.{module,service}.ts      scrypt + bcrypt heredado + needsRehash
src/auth/sesiones/sesiones.{module,service}.ts      emitir, refrescar, rotar, revocar, listar
src/auth/sesiones/sesion.constants.ts               TTLs y motivos
src/auth/sesiones/token-opaco.ts                    generación + SHA-256
src/auth/sesiones/auditoria-auth.service.ts         IntentoAutenticacion
src/auth/step-up/{contexto-reautenticacion,operacion-sensible.decorator,step-up.interceptor}.ts
src/auth/throttling/auth-throttling.ts              LimitarIntentosLogin/Refresh/Reautenticacion
src/common/validacion/validacion-global.pipe.ts + validacion.module.ts
src/common/excepciones/filtro-global-excepciones.ts + excepciones.module.ts
src/common/secretos/{comparar-secreto,secreto-interno.guard}.ts   @RequiereSecretoInterno()
src/common/endpoint-retirado/endpoint-retirado.decorator.ts       @EndpointRetirado()
src/swagger/configurar-swagger.ts
src/cliente-internet/domain/…                       (checkpoint c533939, sin conectar)
```

Borrados: `JwtStrategy.ts`, `prisma.controller.ts`, `bcrypt-password-hasher.adapter.ts` (ahora
`PASSWORD_HASHER` → `PasswordService`), los tres archivos con espacio en el nombre.

---

## 6. Checklist para llevar la etapa a producción

Nada de esto lo hace Claude: es del dueño, y `main` solo se toca con su autorización.

- [ ] **Front React y app Android listos** para: `refresh_token` + manejo de 401 (§4.1),
      `plataforma: 'ANDROID'` + `instalacionId` en el login del Android, códigos de socket, y
      campos extra en los bodies (ahora dan **400**).
- [ ] **Avisar:** todos los usuarios tendrán que volver a iniciar sesión una vez (los tokens
      viejos no traen `sid` ni `exp`).
- [ ] **Railway:** Node 24 (lo toma de `engines`), `npm ci`.
- [ ] **Variables de entorno:**

| Variable | Obligatoria | Efecto si falta |
|---|---|---|
| `MY_SECRET_TOKEN_KEY_CRM` | Sí (ya existía) | No se pueden firmar ni verificar JWT |
| `META_APP_SECRET` | **Sí, nueva** | El webhook de WhatsApp responde 403 y **deja de recibir** |
| `WHATSAPP_VERIFY_TOKEN` | Sí | La verificación del webhook falla cerrado |
| `INTERNAL_SECRET` | Sí | Bot de tickets y broadcast de Nuvia → 401 (y los clientes deben mandar `x-internal-secret`) |
| `AUTH_GUARD_MODO` | No | Sin ella: **estricto** (lo correcto en producción) |
| `VALIDACION_MODO` | No | Sin ella: **estricto** |
| `SWAGGER_HABILITADO` | No | Sin ella: `/docs` apagado |
| `EXPONER_DETALLE_ERRORES` | No | **Nunca** `true` en Railway |

- [ ] Confirmar G4 (Banrural) antes del deploy.
- [ ] Respaldo de la BD → `npx prisma migrate deploy` (solo la migración aditiva de auth).
- [ ] Tras el arranque: log *"Guard global de JWT en modo ESTRICTO"* y *"ValidationPipe global
      en modo ESTRICTO"*; los crons registrados; la lista de humo de la guía de auth (§6) completa.
- [ ] Primeras horas: vigilar 400 de validación y 401 en logs. Si algo crítico se rompe, la
      salida rápida es `VALIDACION_MODO=observacion` (y en último caso `AUTH_GUARD_MODO=observacion`),
      no revertir código.
- [ ] Merge a `main` solo después de lo anterior.

---

## 7. Decisiones pendientes del dueño (antes o durante la fase hexagonal)

1. **Mapa de roles por módulo** (G1). Propuesta mínima para arrancar:
   pagos/facturas/borrados → `ADMIN`, `SUPER_ADMIN` (+ el rol de oficina si existe);
   zonas de facturación y configuración → `ADMIN`, `SUPER_ADMIN`; PPPoE y red → los roles
   técnicos que operan hoy; reportes → oficina+. Hay que listar los valores reales de `RolUsuario`.
2. **Aislamiento por empresa** (G2): ¿se fuerza en cada repositorio nuevo (recomendado: todo
   puerto de lectura recibe `empresaId`) o con un guard?
3. **Formato de error para endpoints nuevos** (G8): ¿el del filtro actual o el del contrato
   Angular? Recomendación: extender el filtro para que los errores de dominio con código salgan
   en el formato Angular, sin cambiar los 4xx de rutas existentes.
4. **Banrural** (G4).
5. **Limpieza de sesiones** (G6): cron diario que borre sesiones y refresh vencidos hace > N días
   e intentos de autenticación > 90 días.
6. ¿Se agrega `@OperacionSensible` al corte legacy por IP (G3) o se retira ese endpoint cuando
   todos estén en PPPoE?
7. ¿Validación de variables de entorno al arrancar (G7)? Se puede hacer sin dependencias nuevas
   con una función `validate` propia en `ConfigModule.forRoot`.

---

## 8. Guía para el siguiente chat: refactor hexagonal

> **Esta sección es la que debe leer primero el siguiente chat de Claude Code.**
> El plan funcional del corte y de los módulos sigue siendo
> `guia-desarrollo-cobranza-corte-crm-nova.md` (§13 y siguientes). Aquí se ajusta a lo que
> cambió con la etapa de auth y se fija el orden.

### 8.1 Antes de empezar

1. Leer `CLAUDE.md` del repo. **Hoy todavía dice "Etapa actual: SOLO auth y actualización de
   versiones" y prohíbe el refactor hexagonal.** El primer commit de la fase nueva es
   actualizarlo (propuesta en el Anexo A), con autorización del dueño.
2. `git fetch origin && git checkout refactorizaciones-hexagonales && git pull --ff-only`.
3. Línea base: `npm ci && npx prisma generate && npm run build && npm run lint:check && npm test`.
   Anotar: lint ≤ 410 errores, Jest 4/15 suites en verde (las otras 11 son boilerplate roto).
   Reportar al dueño y esperar confirmación.
4. **Usar `npm run lint:check`**, no `npm run lint`: este último lleva `--fix` y reescribe todo el repo.
5. Confirmar con el dueño si la etapa auth **ya se desplegó** (§6). La guía de auth dice que el
   refactor hexagonal empieza con la etapa desplegada y estable. Si no está desplegada, cada
   cambio hexagonal se acumula encima de un deploy grande pendiente.

### 8.2 Reglas nuevas que trae la etapa de auth (obligatorias en todo módulo nuevo)

| Tema | Regla |
|---|---|
| **Autenticación** | No hace falta `@UseGuards(JwtAuthGuard)`: el guard global ya protege. No agregarlo en código nuevo. Un endpoint público necesita `@Public()` **y** su propia protección (firma, `@RequiereSecretoInterno()`, token de enlace) |
| **Usuario** | Leer el usuario de `req.user` tipado como `UsuarioAutenticado` (`src/auth/JwtGuard/jwt-payload.ts`). `rol`, `activo` y `empresaId` ya vienen de la BD. Pasar `empresaId` e `id` del usuario a los casos de uso como **input**; el dominio no conoce `req` |
| **Roles** | Usar `@Roles(RolUsuario.ADMIN, RolUsuario.SUPER_ADMIN)` en el controlador. **No** validar el rol a mano dentro del caso de uso (la guía de cobranza §11 decía lo contrario porque entonces no existía `RolesGuard`: queda superado) |
| **Reautenticación** | Usar `@OperacionSensible()` en el endpoint. El caso de uso que verifica contraseña usa `AuthService.reautenticarUsuarioPorId` (honra el step-up). Nuevos endpoints sensibles (aprobar/ejecutar lotes de corte, reintentar renglones) llevan este decorador |
| **DTOs** | El pipe global es **estricto y sin conversión implícita**: todo campo que llegue debe estar declarado con un decorador de class-validator; números en `@Query()`/`@Param()` necesitan `@Type(() => Number)` o `ParseIntPipe`; booleanos de query necesitan `@Transform` explícito. Un DTO vacío rechaza cualquier campo. **No** agregar `ValidationPipe` local en controladores nuevos (redundante) |
| **Swagger** | El plugin documenta solo: escribir comentarios `/** */` útiles en los DTOs. Importar `PartialType`/`OmitType`/`PickType` de `@nestjs/swagger`, **no** de `@nestjs/mapped-types` |
| **Errores** | Los 500 los sanea el filtro global: no hace falta esconder stacks a mano. Errores de dominio → excepción de Nest con código estable en la capa de presentación. Hasta resolver G8, mantener el formato actual en rutas existentes |
| **Logs** | `new Logger(Clase.name)`, solo IDs. Nunca correos, teléfonos, DPI, contraseñas, tokens ni secretos PPPoE |
| **Contraseñas** | Siempre vía `PasswordService` / `PASSWORD_HASHER`. Nunca `bcrypt` directo |
| **Tiempo** | `America/Guatemala` vía reloj/`dayjs` configurado; nunca `new Date()` suelto para fechas de negocio |
| **Tests** | Jest ya funciona con imports `src/...`: escribir `.spec.ts` de dominio y casos de uso con puertos falsos. Correr con `npm test` (usa `--experimental-vm-modules`) |
| **TypeScript** | `strict: false` sigue vigente para no romper legacy. En módulos nuevos escribir como si fuera estricto (tipos explícitos, sin `any`) |
| **Migraciones** | Solo aditivas; `migrate diff`/`--create-only` revisado a mano; nunca `migrate dev` contra producción |

### 8.3 Patrón hexagonal de referencia

Copiar la forma de los módulos que ya están bien hechos:
- `src/modules/pppoe-automatizacion` (puerto público `PPPOE_PROVISIONAMIENTO`, casos de uso,
  executors) y `src/modules/pppoe-cliente-cuenta` (entidad con transiciones).
- `src/credito/credito-cron` (cron con puerto + repositorio).
- Estructura, nombres y tokens: §5 de `guia-desarrollo-cobranza-corte-crm-nova.md`
  (`domain/ application/ infra/ presentation/`, `Symbol` en el mismo archivo del puerto,
  `create/hydrate/toPrimitives`, carpetas `application` e `infra`, `pppoe` con tres p).

**Strangler, siempre:** el controlador legacy conserva rutas y formas de respuesta y delega en
los casos de uso nuevos. Un PR/commit por ruta o grupo pequeño de rutas.

### 8.4 Orden propuesto

Nombres de commit: `refactorizacion <modulo> #N` (convención de `CLAUDE.md`, que manda sobre
las ramas `feature/*` que sugería la guía de cobranza). Trabajo en `refactorizaciones-hexagonales`;
cuando un paso queda estable, el dueño mueve `checkpoints-refactorizaciones`.

| Paso | Contenido | Equivale en la guía de cobranza | Notas por la etapa auth |
|---|---|---|---|
| **H0** | Actualizar `CLAUDE.md` (Anexo A) + línea base + diagnóstico sobre copia de producción | Paso 0 | Incluye verificar el índice parcial de cuentas PPPoE (hallazgo 9.6) |
| **H1** | **Saneamiento**: `updateFactura`, `deleteOnePayment`, `generatePagoFromBanrural` dejan de escribir `estadoCliente`; *clamp* en `shouldSkipZoneToday`; `updateClienteInternet` no pisa estados si el DTO no los trae | Paso 1 | No es hexagonal, pero cambia quién es "facturable": va primero. Revisar que los DTOs tocados sigan pasando el pipe estricto |
| **H2** | **Roles en la API existente** (decisión §7.1): `@Roles` por controlador, módulo por módulo, empezando por `facturacion`, `facturacion-zona`, `banrural-integration`, `ruta-cobro`, `ssh-mikrotik-connection` | — (nuevo) | Cierra G1 antes de que el refactor mueva código. Un commit por módulo. Coordinar con el front (403 nuevos) |
| **H3** | **`clientes` hexagonal** | Paso 3 | Ya existe dominio inicial en `src/cliente-internet/domain/` (checkpoint `c533939`: `ClienteInternetEntity` con `actualizarPerfil`, `confirmarSuspensionPppoe`, `confirmarDesinstalacion`, `marcarEliminado`, WhatsApp…, y `CLIENTE_INTERNET_REPOSITORY`). **Decidir con el dueño**: moverlo a `src/modules/clientes/` como dice la guía, o terminarlo en su lugar. Mover el puerto `CLIENTE_INTERNET_ESTADO_OPERATIVO` desde `pppoe-automatizacion`. Corregir de paso que `CompletarClienteDesinstalacion` no marca `DESINSTALADO` |
| **H4** | **`tareas-programadas`** (reloj, candado Postgres, registro de ejecuciones) + `FechaOperativa`/`CalendarioCobranza` | Paso 2 | Buen lugar para el cron de limpieza de sesiones (G6) como primer consumidor real |
| **H5** | **`zonas-facturacion` hexagonal** (`modoCorte`, validaciones, *clamp*) | Paso 4 | `@Roles(ADMIN, SUPER_ADMIN)` en escrituras |
| **H6** | **`mensajeria-cliente`** (outbox + despachador sobre `cloud-api-meta`) | Paso 5 | |
| **H7** | **`cobranza`**: evaluación y lotes simulados | Paso 6 | Rutas nuevas protegidas por el guard global; `@Roles` en lugar de validar rol en el caso de uso |
| **H8** | **`cobranza`**: ejecución del corte | Paso 7 | Aprobar/ejecutar/reintentar con `@Roles(ADMIN, SUPER_ADMIN)` + `@OperacionSensible()` |
| **H9** | **`cobranza`**: reconciliación | Paso 8 | |
| **H10** | Salida por fases | Paso 9 | |
| **H11** | `ciclo-facturacion` hexagonal (reemplaza los 4 crons) | Paso 10 | Revisar el orden de arranque de crons: Nest 12 cambió el orden de los lifecycle hooks |
| **H12** | `pagos` (oficina, ruta, Banrural) | Paso 11 | |

Después, fuera del camino crítico (orden sugerido por tamaño y riesgo): `dashboard` (3 238
líneas), `ruta-cobro`, `whatsapp-template`, `web-sockets`, `contrato-cliente`,
`push-dispositivos`, `metas-tickets`, `location`, `customer-payload`, CRUDs pequeños
(`sector`, `servicio`, `servicio-internet`, `tipo-servicio`, `empresa`, `id-contrato`),
mensajería vieja (`twilio*`, `mensaje`, `whatsapp-campaigns`, `open-ia`, `fireworks-ia`).
`auth` **no** se refactoriza: se acaba de rehacer.

### 8.5 Mapa actual de módulos (en `43fc43b`)

Líneas aproximadas de TypeScript por carpeta. **H** = tiene `domain/`.

- **Hexagonales:** `modules/pppoe-automatizacion` 16 254 · `modules/excel-reports` 14 890 ·
  `modules/pppoe-operacion` 10 335 · `modules/cliente-instalacion` 8 960 ·
  `modules/cliente-desinstalacion` 8 392 · `modules/mikrotik-ssh` 7 423 ·
  `modules/real-time-location` 6 276 · `modules/ticket-soporte-conformidad` 5 913 ·
  `modules/pppoe-auditoria` 5 786 · `credito` 4 867 · `modules/pppoe-cliente-cuenta` 4 771 ·
  `tickets-soporte` 4 328 (con Prisma en services) · `modules/pppoe-perfil-homologacion` 2 055 ·
  `generate-reports` 2 005 · `mikro-tik` 1 816 · `user` 1 602 · y otros menores.
- **Parcial:** `cliente-internet` 3 672 (dominio nuevo sin conectar; el resto legacy).
- **Legacy (prioridad de refactor):** `zona-facturacion-cron` 1 240 · `facturacion` 2 569 ·
  `facturacion-zona` 445 · `banrural-integration` 513 · `ruta-cobro` 1 103 · `cloud-api-meta` 384 ·
  `dashboard` 3 238 · `auth` 2 322 (rehecho; no tocar).

### 8.6 Definición de "hecho" por paso

1. `npm run build` en verde; `npm run lint:check` ≤ 410; `npm test` sin suites nuevas rotas y con
   pruebas del dominio nuevo.
2. La app arranca: logs de guard y pipe en ESTRICTO; crons registrados.
3. Lista de humo (§6 de la guía de auth) completa.
4. Rutas existentes: mismas rutas, mismos campos, mismas respuestas (o cambio aprobado y avisado).
5. Commit `refactorizacion <modulo> #N`, un propósito, en `refactorizaciones-hexagonales`.
6. Este documento o la guía de cobranza actualizados si cambió una decisión.

### 8.7 Prohibido (se mantiene)

Tocar `main`; instalar dependencias sin preguntar; migraciones destructivas; cambiar contratos
de rutas existentes sin aprobación; desactivar el guard o el pipe globales en código (los modos
de observación existen solo por variable de entorno); quitar un `@EndpointRetirado()` sin
commit propio y autorización; registrar datos sensibles.

---

## Anexo A — Propuesta de `CLAUDE.md` para la fase hexagonal

Para que el dueño lo revise y lo suba como primer commit de la fase (`refactorizacion docs #1`).

```markdown
# CRM NOVA — Servidor (NestJS 12 + Prisma + PostgreSQL)

API de un ISP **en producción**: facturación, cobranza, clientes y corte de servicio
por PPPoE sobre routers MikroTik. Lo que se rompe aquí deja gente sin internet o
altera facturas reales. Trabaja en consecuencia.

Lee antes de escribir código:
- @docs/guia-post-auth-refactor-hexagonal-crm-nova.md — estado actual y orden de trabajo
- @docs/guia-desarrollo-cobranza-corte-crm-nova.md — diseño funcional del corte y de los módulos

## Etapa actual: refactor hexagonal (después de auth + majors)

La etapa de auth y NestJS 12 está terminada. Ahora se refactorizan módulos legacy a
hexagonal, en el orden de la §8.4 de la guía post-auth, con patrón strangler.
Fuera de alcance salvo pedido explícito: reescribir `auth`, cambiar la lógica de
cálculo de facturas fuera del paso de saneamiento, promesas de pago.

## Git
- `main` es solo lectura. Nunca push ni merge hacia o desde `main` sin autorización explícita.
- Trabajo activo: `refactorizaciones-hexagonales`. Puntos de control: `checkpoints-refactorizaciones`.
- Commits `refactorizacion <modulo> #N`, un propósito por commit.
- Antes de empezar: `git fetch origin && git pull --ff-only`.

## Comandos
npm ci · npx prisma generate · npm run build · npm run lint:check (NO `npm run lint`: hace --fix)
npm test (Jest 30 con --experimental-vm-modules) · npm run start:dev · npx prisma migrate status
Node 24 (`.nvmrc`). Línea base: lint ≤ 410 errores; Jest 4/15 suites (11 son boilerplate roto).

## Seguridad que ya existe (no la rehagas ni la rodees)
- Guard global JWT + sesión en BD: toda ruta exige token salvo `@Public()`. No agregues
  `@UseGuards(JwtAuthGuard)` en código nuevo.
- `@Roles(...)` para autorizar; `@OperacionSensible()` para operaciones que piden contraseña.
- ValidationPipe global estricto SIN conversión implícita: declara todo campo en el DTO y
  convierte tipos con `@Type`/`@Transform`.
- Usuario: `req.user` (`UsuarioAutenticado`); rol/activo/empresaId vienen de la BD.
- Contraseñas solo vía `PasswordService`. Filtro global sanea los 500.
- `PartialType` y afines desde `@nestjs/swagger`.

## Reglas que no se negocian
- No instales dependencias sin preguntar.
- Migraciones solo aditivas. En producción solo `migrate deploy`.
- No cambies rutas, campos ni respuestas de endpoints existentes sin aprobación.
- Nunca registres secretos, contraseñas, secretos PPPoE, tokens ni datos personales.
- Zona horaria de negocio: `America/Guatemala`; nunca `new Date()` suelto para fechas de negocio.
- `domain/` sin Nest ni Prisma; `application/` sin Prisma; Prisma solo en `infra/`.
- Si una decisión no está en las guías y cambia comportamiento, pregunta.
```
