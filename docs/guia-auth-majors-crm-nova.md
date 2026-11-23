# CRM NOVA (servidor) — Guía de la etapa: seguridad de auth y subida de versiones

> **Documento operativo de esta etapa.** Manda sobre cualquier otro documento
> mientras esta etapa esté abierta.
>
> Repo `CardonaSantos/SERVER_CRM_NOVA` · Línea base auditada: `108c6ef`
> Versión 1.0 · 23-nov-2026

---

## 1. Alcance

### 1.1 Qué hacemos en esta etapa

1. **Cerrar los agujeros de autenticación y autorización** del servidor.
2. **Subir NestJS 10 → 11 → 12** con las dependencias que eso arrastra.
3. Instalar **Swagger** y documentar los endpoints.

### 1.2 Qué NO hacemos aquí

- Refactorizaciones hexagonales de módulos legacy.
- El módulo de cobranza y corte por mora (checklist §13 de
  `guia-desarrollo-cobranza-corte-crm-nova.md`): **en pausa**.
- Cualquier cambio de lógica de negocio, cálculo de facturas, periodos o estados.
- Limpieza de nombres de carpetas, deuda técnica, renombrar archivos.

La razón de separarlo: el upgrade **preserva** comportamiento y el auth lo
**cambia** a propósito. Si se mezclan y algo falla, no hay forma de saber cuál de
los dos lo rompió. Las refactorizaciones hexagonales empiezan cuando esta etapa
esté desplegada y estable.

---

## 2. Estado verificado del servidor

Todo lo de esta sección está comprobado en el código del commit `108c6ef`. No hace
falta volver a investigarlo.

### 2.1 Autenticación

| Hallazgo | Evidencia | Gravedad |
|---|---|---|
| Los JWT **no expiran nunca** | `auth.module.ts` registra el JWT sin `signOptions`; `auth.service.ts` firma con `sign(payload)` sin `expiresIn`. `expiresIn` no existe en `src/` | 🔴 |
| **72 de 87 controladores sin `UseGuards`** | ~396 endpoints HTTP; incluye `user.controller`, `facturacion.controller` (14), `cliente-internet`, `ssh-mikrotik-connection` (suspender/activar), `pppoe-automatizacion`, `banrural-integration`, `cloud-api-meta`, `customer-payload`, `prisma.controller` | 🔴 |
| **`POST /auth/regist-user` es público** | `auth.controller.ts` — permite crear un usuario con `rol: SUPER_ADMIN` y cualquier `empresaId` | 🔴 |
| **Sin `ValidationPipe` global** | No hay `APP_PIPE` ni `useGlobalPipes`; solo 15 controladores nuevos lo aplican por ruta. Los DTOs legacy no validan nada | 🔴 |
| **Nada se puede revocar** | No hay tabla de sesiones, refresh token ni lista negra. El guard no consulta la BD: `activo` y `rol` viajan congelados dentro del token. Desactivar un usuario no lo expulsa | 🟠 |
| **Fuerza bruta libre** | Sin `@nestjs/throttler` ni bloqueo por intentos, ni en `/auth/login-user` ni en los endpoints de reautenticación (que reciben la contraseña en el body) | 🟠 |
| **Autorización dispersa** | No existe `RolesGuard` ni decorador `@Roles`. El rol se valida a mano dentro de algunos use-cases de PPPoE; el resto no valida | 🟠 |
| Sin endurecimiento básico | Sin `helmet`, sin `trust proxy` (Railway: `req.ip` es la IP del proxy). Solo `pppoe-cuenta-consulta.controller.ts` resuelve la IP a mano con `x-forwarded-for` | 🟠 |
| Fugas en logs | `console.log` del correo en cada login (`auth.controller.ts`); correos en los warn de login fallido (`auth.service.ts`); el gateway WS imprime el payload decodificado y un prefijo del token | 🟡 |
| Sin filtro global de excepciones | El formato de error varía por módulo; `throwFatalError` oculta el stack solo si `NODE_ENV === 'production'` | 🟡 |
| Secreto leído de dos formas | `ConfigService` en el módulo, `process.env` directo en `JwtStrategy.ts`; nada valida al arrancar que exista | 🟡 |

**Públicos legítimos** (deben seguir abiertos, pero con su propia autenticación —
firma HMAC o secreto compartido, no JWT de usuario): webhook de Meta
(`whatsapp-api-meta`), el bot externo de tickets (`bot-functions`), la firma de
conformidad del cliente (`ticket-conformidad-public`) y, por confirmar, el callback
de Banrural.

### 2.2 Estado para el upgrade

Lo que **ayuda** (verificado en `src/`):

| Revisión | Resultado |
|---|---|
| Deep imports `@nestjs/*/dist/...` | **0** |
| `require()` | **0** |
| `__dirname` / `__filename` | **0** |
| `package-lock.json` | Existe (545 KB) → la línea base se reproduce con `npm ci` |

Esas tres primeras son las que suelen hacer miserable una migración a ESM, y no
tenemos ninguna.

Lo que **hay que resolver**:

- **785 imports absolutos `from 'src/...'` en 311 archivos**, resueltos por el
  mapeo `paths: {"*": ["./*"]}` de `tsconfig.json` más `tsconfig-paths`. Es la
  fricción principal bajo resolución ESM y es un patrón no estándar.
- **`@nestjs/mapped-types` en 65 archivos** (`PartialType`): su rango de peer llega
  hasta Nest 10. Verificar si hay versión para 11/12 o cambiar al `PartialType` de
  `@nestjs/swagger`, que vamos a instalar igual.
- **TypeScript 5.1** → la guía de migración a v12 instala `typescript@^6`, y avisa
  que un `ts-jest` o `typescript-eslint` viejo en el lockfile bloquea TS 6.
  Tenemos `ts-jest` 29, `typescript-eslint` 7 y `eslint` 8: los tres se mueven.
- **`@types/node` 20** mientras Nest 12 pide Node 20.19+ / 22.12+.
- **Nada fija la versión de Node en producción:** no hay `Dockerfile`, ni
  `railway.json`, ni campo `engines`. Railway elige.
- **Passport:** `@nestjs/passport` 12 ya no soporta Nest 10. Lo quitamos (ver §3).
- **45 dependencias de terceros por revalidar** (firebase-admin, twilio, exceljs,
  node-ssh, socket.io, routeros-client), más `@nestjs/schedule` 4,
  `platform-socket.io` 10 y `@nestjs/axios` 4 en sus líneas para Nest 12.
- Tres archivos tienen **un espacio en el nombre**: `CreateEmpresaDto .ts`,
  `DeleteClienteInternetDto .dto.ts`, `CloseTicketDto .dto.ts`. Arreglo gratis.
- **Windows:** agregar `.gitattributes` con `* text=auto eol=lf`. El dueño trabaja
  desde dos máquinas y sin esto aparecen diffs de archivos completos.

### 2.3 El problema de fondo

**No hay red de pruebas.** 14 de los 15 `.spec.ts` son el boilerplate que genera el
CLI (`should be defined`) en módulos como `olt`, `location` y `twilio-mensajes`.
Cobertura real sobre los 87 controladores: cero.

Esto decide la forma de trabajar: después de cada etapa la verificación es
**compilar + arrancar + la lista de humo de §6**, hecha a mano. Y por eso el
upgrade va de un major a la vez.

Importa en concreto: NestJS 12 cambia cómo se invocan los *lifecycle hooks* —
ahora corren por nivel de jerarquía de componentes en lugar de por orden de
registro. Es justo el tipo de cambio que reordena la inicialización de un cron sin
que truene nada.

---

## 3. Decisiones tomadas

| # | Decisión | Por qué |
|---|---|---|
| **D1** | **Auth construido a mano**, no con `@nestjs/authentication` todavía | El paquete oficial existe y es first-party, pero va en 0.1.0, y hay reporte de que no termina el access token cuando termina la sesión — justo nuestro requisito principal. Además pide Nest 11/12 |
| **D2** | **Copiamos su diseño exacto**: `TokenService` con emisión y refresh, sesiones con doble TTL, familias de refresh, hash SHA-256, `@Public()`, claim `amr` | Así migrar al paquete oficial más adelante es un reemplazo, no una reescritura |
| **D3** | **Quitamos Passport** | Lo usamos para una sola `JwtStrategy`. Un guard propio con `JwtService` hace lo mismo, permite consultar la sesión en BD en el mismo lugar, y quita la dependencia que más duele al subir a ESM |
| **D4** | **Refresh token opaco, no JWT**, guardado solo como **hash SHA-256** | Si lo vas a validar contra la BD igual, firmarlo no agrega nada. Y bcrypt sobre un token aleatorio de 256 bits solo cuesta latencia: bcrypt existe para contraseñas humanas de baja entropía |
| **D5** | **Rotación con familias y detección de reutilización** | Si reaparece un refresh ya gastado, hay dos copias de la sesión en circulación: se revoca la familia completa y se alerta. Es la señal más confiable de robo que existe |
| **D6** | **Guard global (`APP_GUARD`) con `@Public()`** | Seguridad por omisión: un controlador nuevo nace protegido. Hoy es al revés |
| **D7** | **Se enciende primero en modo observación** | El guard registra lo que *habría* rechazado, sin rechazar, unos días. Ese log dice qué consume el front de verdad. Encenderlo a ciegas rompe 72 controladores el primer día |
| **D8** | **Step-up con `amr` para las operaciones sensibles** | Hoy la reautenticación manda la contraseña en el body de cada petición. Con `amr` se reautentica una vez, queda sellado unos minutos, y la contraseña deja de viajar |
| **D9** | **scrypt (`node:crypto`, N=2^17, r=8, p=1)** con migración por `needsRehash` | Es el estándar actual y quita una dependencia. Se verifica con bcrypt el hash viejo y se re-hashea al vuelo: nadie cambia su contraseña |
| **D10** | **Upgrade 10 → 11 → 12, nunca de un salto** | Sin pruebas, si saltas no sabes cuál major rompió qué |
| **D11** | **Swagger va después del upgrade** | Su versión está acoplada a la de Nest; instalarlo en 10 obliga a rehacerlo en 12 |
| **D12** | **El parche de seguridad va antes que todo** | El servidor está abierto **hoy**. Estar en Nest 10 no es un riesgo activo; `regist-user` público sí |

### 3.1 Parámetros de sesión (propuestos — confirmar con el dueño)

| Parámetro | Propuesta |
|---|---|
| Access token | 20 min |
| Refresh web | 7 días |
| Refresh app Android | 30 días (los técnicos trabajan sin señal) |
| `idleTtl` web | 3 días |
| `absoluteTtl` web | 14 días |

Identidad de dispositivo: reutilizar `UsuarioPushDispositivo.instalacionId`, que ya
existe y es estable por instalación.

---

## 4. Orden de trabajo

Cada etapa es su propio commit (o cadena de commits), con su verificación. No se
empieza una sin terminar la anterior.

### Etapa 0 · Línea base

- [ ] `npm ci`
- [ ] `npx prisma generate`
- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] Copia de producción restaurada en Postgres local, `.env` apuntando ahí
- [ ] La app arranca: `npm run start:dev`
- [ ] Anotar `node -v` y fijarlo en `engines` + `.nvmrc`
- [ ] `.gitattributes` con `* text=auto eol=lf`
- **Hecho:** los cuatro comandos en verde y la app arrancando. **Reportar al dueño
  y esperar confirmación antes de seguir.**

### Etapa 1 · Parche de seguridad (sobre Nest 10) — `refactorizacion auth #N`

Lo urgente y acotado, que sobrevive intacto al upgrade:

- [ ] Cerrar `POST /auth/regist-user` (guard + rol SUPER_ADMIN)
- [ ] `expiresIn` en el JWT
- [ ] `helmet` y `trust proxy`
- [ ] `@nestjs/throttler` en login y en los endpoints de reautenticación
- [ ] `JwtAuthGuard` explícito en los diez controladores más peligrosos:
      `user`, `facturacion`, `ssh-mikrotik-connection`, `cliente-internet`,
      `pppoe-automatizacion`, `banrural-integration`, `cloud-api-meta`,
      `customer-payload`, `mikrotik-ssh`, y borrar `prisma.controller.ts`
- [ ] Quitar de los logs correos, payloads de token y datos personales
- **Ojo:** poner `expiresIn` **saca a todos los usuarios una vez**. Coordinar con el
  front antes de desplegar.
- **Hecho:** compila, arranca, login funciona, la lista de humo pasa.

### Etapa 2 · Nest 10 → 11 — `refactorizacion upgrade #N`

- [ ] Subir `@nestjs/*` a la línea 11 y las deps acopladas
- [ ] Resolver `@nestjs/mapped-types`
- [ ] Compilar, arrancar, humo completo

### Etapa 3 · Quitar Passport — `refactorizacion auth #N`

- [ ] Guard propio con `JwtService` reemplaza `JwtStrategy`
- [ ] Borrar `@nestjs/passport`, `passport`, `passport-jwt` y sus `@types`
- [ ] Los 15 controladores que usan `JwtAuthGuard` siguen funcionando igual

### Etapa 4 · Nest 11 → 12 — `refactorizacion upgrade #N`

- [ ] TypeScript 6, `ts-jest`, `typescript-eslint`, `eslint`, `@types/node`
- [ ] Paquetes ESM, CLI nuevo
- [ ] Revisar el orden de arranque de los 4 crons (cambio de lifecycle hooks)
- [ ] Cambiar `helmet` por `app.useSecurityHeaders()`
- [ ] Compilar, arrancar, humo completo

### Etapa 5 · Imports `src/...` — `refactorizacion upgrade #N`

- [ ] Decidir con el dueño: mantener con resolver o reescribir
- [ ] Arreglar los tres archivos con espacio en el nombre

### Etapa 6 · Swagger — `refactorizacion swagger #N`

- [ ] `@nestjs/swagger` en la versión que corresponda a Nest 12
- [ ] Plugin del CLI en `nest-cli.json` (`"plugins": ["@nestjs/swagger"]`) para no
      decorar 396 endpoints a mano
- [ ] `addBearerAuth()` en el `DocumentBuilder`
- [ ] La doc **no** queda pública en Railway: detrás de auth o apagada en producción

### Etapa 7 · Auth completo — `refactorizacion auth #N`

- [ ] Migración aditiva: `SesionUsuario`, `RefreshToken`, `IntentoAutenticacion`
- [ ] `TokenService`: emitir, refrescar, rotar, revocar familia
- [ ] Guard global con `@Public()`, **en modo observación primero** (D7)
- [ ] `ValidationPipe` global: `transform` con conversión implícita de tipos y
      `whitelist`; `forbidNonWhitelisted` módulo por módulo, no de golpe
- [ ] `RolesGuard` + `@Roles`
- [ ] Step-up con `amr` para cortes y operaciones sensibles
- [ ] scrypt con `needsRehash`
- [ ] Filtro global de excepciones
- [ ] Revocación de sockets al revocar una sesión
- [ ] `GET /auth/sesiones` y cierre de sesión real

### Etapa 8 · Cerrar los endpoints restantes

- [ ] Con el log de la etapa 7, cerrar los controladores por tandas
- [ ] Marcar `@Public()` los webhooks legítimos (§2.1) y darles su propia firma
- [ ] Activar el guard de verdad

---

## 5. Definición de "hecho" por etapa

1. `npm run build` y `npm run lint` en verde.
2. La app arranca y los 4 crons se registran.
3. La lista de humo de §6 pasa completa.
4. Commit numerado, en la rama correcta, con un solo propósito.
5. Si la etapa tocó algo que el front consume, está avisado antes de desplegar.

---

## 6. Lista de humo manual

Sin pruebas automáticas, **esta lista es la red**. Se corre completa después de
cada etapa.

- [ ] Login con usuario real; el token sirve en una ruta protegida
- [ ] Login con contraseña incorrecta: rechaza y no filtra datos
- [ ] Listar clientes y abrir el detalle de uno
- [ ] Editar un cliente y que no se le cambien `estadoCliente` ni `estadoCobranza`
- [ ] Generar una factura manual
- [ ] Registrar un pago de oficina; la factura y el saldo quedan bien
- [ ] Registrar un pago en ruta
- [ ] Borrar un pago y que el estado se recalcule
- [ ] Suspender un cliente de prueba por PPPoE contra el MikroTik de pruebas
- [ ] Reactivarlo
- [ ] Reintentar una operación PPPoE fallida (idempotencia)
- [ ] El socket conecta con token y recibe eventos
- [ ] Los 4 crons de `zona-facturacion-cron` quedan registrados al arrancar
- [ ] Generar un reporte de Excel
- [ ] Subir una imagen (DigitalOcean Spaces)
- [ ] El webhook de Meta sigue recibiendo
- [ ] El bot externo sigue creando tickets

---

## 7. Preguntas abiertas — preguntar, no inventar

1. Duraciones de sesión: ¿se confirman las de §3.1?
2. ¿Quién ajusta el front React y la app Android para el refresh y el 401? La
   etapa 1 no se despliega sin eso.
3. ¿El callback de Banrural debe ser público? ¿Hay otras integraciones externas
   pegándole al servidor que no estén en §2.1?
4. Imports `src/...`: ¿mantener con resolver o reescribir?
5. ¿Qué versión de Node corre hoy en Railway?

---

## 8. Prohibido en esta etapa

- Tocar `main`.
- Instalar dependencias sin preguntar.
- Migraciones destructivas de cualquier tipo.
- Cambiar rutas, nombres de campos o formas de respuesta de endpoints existentes.
- Empezar refactorizaciones hexagonales o tocar la lógica de cobranza.
- Commits que mezclen upgrade con cambios de auth.
- Desplegar a producción sin respaldo previo de la base.
