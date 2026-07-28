import { Prisma } from '@prisma/client';

import { PppoeOperacionPasoPrismaMapper } from './pppoe-operacion-paso-prisma.mapper';

import { PppoeOperacionPrismaEnumMapper } from './pppoe-operacion-prisma-enum.mapper';
import {
  PppoeOperacionDetalle,
  PppoeOperacionListItem,
  PppoeOperacionPasoReadModel,
  PppoeOperacionReintentoResumen,
} from '../../domain/read-models/pppoe-operacion.read-model';
import { PppoeOperacionResultado } from '../../domain/props/pppoe-operacion.props';

/**
 * ============================================================
 * SELECTS REUTILIZABLES
 * ============================================================
 */

/**
 * Campos seguros de un usuario.
 *
 * No se selecciona la contraseña del CRM.
 */
const usuarioResumenSelect = Prisma.validator<Prisma.UsuarioSelect>()({
  id: true,
  nombre: true,
  correo: true,
  telefono: true,
  rol: true,
  activo: true,
});

/**
 * Campos resumidos de un servicio de Internet.
 */
const servicioResumenSelect = Prisma.validator<Prisma.ServicioInternetSelect>()(
  {
    id: true,
    nombre: true,
    velocidad: true,
    precio: true,
    estado: true,
  },
);

/**
 * Campos resumidos del cliente.
 */
const clienteResumenSelect = Prisma.validator<Prisma.ClienteInternetSelect>()({
  id: true,
  nombre: true,
  apellidos: true,
  telefono: true,
  dpi: true,
  direccion: true,
});

/**
 * Campos resumidos del acceso de Internet.
 */
const accesoResumenSelect =
  Prisma.validator<Prisma.ClienteAccesoInternetSelect>()({
    id: true,
    clienteId: true,
    servicioInternetId: true,
    tecnologia: true,
    metodoAutenticacion: true,
    estado: true,

    cliente: {
      select: clienteResumenSelect,
    },

    servicioInternet: {
      select: servicioResumenSelect,
    },
  });

/**
 * Campos seguros de la cuenta PPPoE.
 *
 * No se seleccionan:
 *
 * - secretoCifrado;
 * - secretoIv;
 * - secretoAuthTag;
 * - versionClave.
 */
const cuentaResumenSelect = Prisma.validator<Prisma.ClientePppoeCuentaSelect>()(
  {
    id: true,
    accesoInternetId: true,
    perfilHomologacionId: true,
    usuario: true,
    estado: true,
    generadoEn: true,
    secretCreadoEn: true,
    activadoEn: true,
    suspendidoEn: true,
    eliminadoEn: true,
    ultimaSincronizacionEn: true,
    ultimoError: true,

    accesoInternet: {
      select: accesoResumenSelect,
    },
  },
);

/**
 * Campos seguros del router MikroTik.
 *
 * No se seleccionan:
 *
 * - usuario SSH;
 * - passwordEnc.
 */
const routerResumenSelect = Prisma.validator<Prisma.MikrotikRouterSelect>()({
  id: true,
  nombre: true,
  host: true,
  sshPort: true,
  descripcion: true,
  activo: true,
});

/**
 * Campos resumidos del perfil homologado.
 */
const perfilResumenSelect =
  Prisma.validator<Prisma.PppoePerfilHomologacionSelect>()({
    id: true,
    mikrotikRouterId: true,
    servicioInternetId: true,
    codigoPerfil: true,
    activo: true,

    servicioInternet: {
      select: servicioResumenSelect,
    },
  });

/**
 * Campos resumidos de una instalación.
 */
const instalacionResumenSelect =
  Prisma.validator<Prisma.ClienteInstalacionSelect>()({
    id: true,
    clienteId: true,
    servicioInternetId: true,
    tipo: true,
    estado: true,
    fechaProgramada: true,
    fechaInicio: true,
    fechaFinalizacion: true,
  });

/**
 * Campos resumidos de una desinstalación.
 */
const desinstalacionResumenSelect =
  Prisma.validator<Prisma.ClienteDesinstalacionSelect>()({
    id: true,
    clienteId: true,
    servicioInternetId: true,
    accesoInternetId: true,
    tipo: true,
    motivo: true,
    estado: true,
    fechaProgramada: true,
    fechaInicio: true,
    fechaFinalizacion: true,
  });

/**
 * Campos resumidos de una operación anterior
 * o de un reintento.
 */
const reintentoResumenSelect = Prisma.validator<Prisma.PppoeOperacionSelect>()({
  id: true,
  numeroIntento: true,
  estado: true,
  errorCodigo: true,
  errorMensaje: true,
  iniciadoEn: true,
  finalizadoEn: true,
  creadoEn: true,
});

/**
 * ============================================================
 * INCLUDE DEL LISTADO
 * ============================================================
 */

/**
 * Relaciones utilizadas por el listado paginado.
 *
 * No carga los pasos completos ni las auditorías.
 */
export const PPPOE_OPERACION_LIST_INCLUDE =
  Prisma.validator<Prisma.PppoeOperacionInclude>()({
    empresa: {
      select: {
        id: true,
        nombre: true,
      },
    },

    cuentaPppoe: {
      select: cuentaResumenSelect,
    },

    mikrotikRouter: {
      select: routerResumenSelect,
    },

    perfilHomologacion: {
      select: perfilResumenSelect,
    },

    instalacion: {
      select: instalacionResumenSelect,
    },

    desinstalacion: {
      select: desinstalacionResumenSelect,
    },

    iniciadoPor: {
      select: usuarioResumenSelect,
    },

    reautenticadoPor: {
      select: usuarioResumenSelect,
    },

    reintentoDe: {
      select: reintentoResumenSelect,
    },

    _count: {
      select: {
        pasos: true,
        auditorias: true,
        reintentos: true,
      },
    },
  });

/**
 * Tipo inferido directamente desde el include del listado.
 */
export type PppoeOperacionListPrismaPayload = Prisma.PppoeOperacionGetPayload<{
  include: typeof PPPOE_OPERACION_LIST_INCLUDE;
}>;

/**
 * ============================================================
 * INCLUDE DEL DETALLE
 * ============================================================
 */

/**
 * Relaciones utilizadas por el detalle.
 *
 * Extiende el listado con:
 *
 * - todos los pasos;
 * - todos los reintentos directos.
 */
export const PPPOE_OPERACION_DETAIL_INCLUDE =
  Prisma.validator<Prisma.PppoeOperacionInclude>()({
    ...PPPOE_OPERACION_LIST_INCLUDE,

    pasos: {
      orderBy: {
        orden: 'asc',
      },
    },

    reintentos: {
      select: reintentoResumenSelect,

      orderBy: {
        numeroIntento: 'asc',
      },
    },
  });

/**
 * Tipo inferido directamente desde el include del detalle.
 */
export type PppoeOperacionDetailPrismaPayload =
  Prisma.PppoeOperacionGetPayload<{
    include: typeof PPPOE_OPERACION_DETAIL_INCLUDE;
  }>;

/**
 * ============================================================
 * MAPPER DE READ MODELS
 * ============================================================
 */

/**
 * Convierte payloads Prisma enriquecidos en contratos
 * de lectura seguros para la aplicación y la UI.
 */
export class PppoeOperacionReadModelPrismaMapper {
  /**
   * Convierte una operación enriquecida en un item
   * para el listado paginado.
   */
  static toListItem(
    raw: PppoeOperacionListPrismaPayload,
  ): PppoeOperacionListItem {
    return {
      /**
       * ======================================================
       * IDENTIFICADORES
       * ======================================================
       */

      id: raw.id,

      empresaId: raw.empresaId,

      cuentaPppoeId: raw.cuentaPppoeId,

      mikrotikRouterId: raw.mikrotikRouterId,

      perfilHomologacionId: raw.perfilHomologacionId,

      instalacionId: raw.instalacionId,

      desinstalacionId: raw.desinstalacionId,

      /**
       * ======================================================
       * REINTENTOS E IDEMPOTENCIA
       * ======================================================
       */

      reintentoDeId: raw.reintentoDeId,

      numeroIntento: raw.numeroIntento,

      claveIdempotencia: raw.claveIdempotencia,

      /**
       * ======================================================
       * CLASIFICACIÓN
       * ======================================================
       */

      tipo: PppoeOperacionPrismaEnumMapper.tipoOperacionToDomain(raw.tipo),

      origen: PppoeOperacionPrismaEnumMapper.origenOperacionToDomain(
        raw.origen,
      ),

      canal: PppoeOperacionPrismaEnumMapper.canalOperacionToDomain(raw.canal),

      estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToDomain(
        raw.estado,
      ),

      /**
       * ======================================================
       * AUTORIZACIÓN
       * ======================================================
       */

      iniciadoPorId: raw.iniciadoPorId,

      reautenticadoPorId: raw.reautenticadoPorId,

      requiereReautenticacion: raw.requiereReautenticacion,

      reautenticacionExitosa: raw.reautenticacionExitosa,

      reautenticadoEn: this.cloneOptionalDate(raw.reautenticadoEn),

      /**
       * ======================================================
       * SNAPSHOTS
       * ======================================================
       */

      usuarioPppoeSnapshot: raw.usuarioPppoeSnapshot,

      codigoPerfilSnapshot: raw.codigoPerfilSnapshot,

      routerHostSnapshot: raw.routerHostSnapshot,

      routerPuertoSnapshot: raw.routerPuertoSnapshot,

      /**
       * ======================================================
       * RESULTADO
       * ======================================================
       */

      motivo: raw.motivo,

      resultado: this.resultadoToDomain(raw.resultado),

      errorCodigo: raw.errorCodigo,

      errorMensaje: raw.errorMensaje,

      /**
       * ======================================================
       * FECHAS
       * ======================================================
       */

      iniciadoEn: this.cloneOptionalDate(raw.iniciadoEn),

      finalizadoEn: this.cloneOptionalDate(raw.finalizadoEn),

      canceladoEn: this.cloneOptionalDate(raw.canceladoEn),

      duracionMs: raw.duracionMs,

      creadoEn: new Date(raw.creadoEn.getTime()),

      actualizadoEn: new Date(raw.actualizadoEn.getTime()),

      /**
       * ======================================================
       * RELACIONES
       * ======================================================
       */

      empresa: {
        id: raw.empresa.id,
        nombre: raw.empresa.nombre,
      },

      cuentaPppoe: {
        id: raw.cuentaPppoe.id,

        accesoInternetId: raw.cuentaPppoe.accesoInternetId,

        perfilHomologacionId: raw.cuentaPppoe.perfilHomologacionId,

        usuario: raw.cuentaPppoe.usuario,

        estado: raw.cuentaPppoe
          .estado as PppoeOperacionListItem['cuentaPppoe']['estado'],

        generadoEn: new Date(raw.cuentaPppoe.generadoEn.getTime()),

        secretCreadoEn: this.cloneOptionalDate(raw.cuentaPppoe.secretCreadoEn),

        activadoEn: this.cloneOptionalDate(raw.cuentaPppoe.activadoEn),

        suspendidoEn: this.cloneOptionalDate(raw.cuentaPppoe.suspendidoEn),

        eliminadoEn: this.cloneOptionalDate(raw.cuentaPppoe.eliminadoEn),

        ultimaSincronizacionEn: this.cloneOptionalDate(
          raw.cuentaPppoe.ultimaSincronizacionEn,
        ),

        ultimoError: raw.cuentaPppoe.ultimoError,

        accesoInternet: {
          id: raw.cuentaPppoe.accesoInternet.id,

          clienteId: raw.cuentaPppoe.accesoInternet.clienteId,

          servicioInternetId: raw.cuentaPppoe.accesoInternet.servicioInternetId,

          tecnologia: String(raw.cuentaPppoe.accesoInternet.tecnologia),

          metodoAutenticacion: String(
            raw.cuentaPppoe.accesoInternet.metodoAutenticacion,
          ),

          estado: String(raw.cuentaPppoe.accesoInternet.estado),

          cliente: {
            id: raw.cuentaPppoe.accesoInternet.cliente.id,

            nombre: raw.cuentaPppoe.accesoInternet.cliente.nombre,

            apellidos: raw.cuentaPppoe.accesoInternet.cliente.apellidos,

            telefono: raw.cuentaPppoe.accesoInternet.cliente.telefono,

            dpi: raw.cuentaPppoe.accesoInternet.cliente.dpi,

            direccion: raw.cuentaPppoe.accesoInternet.cliente.direccion,
          },

          servicioInternet:
            raw.cuentaPppoe.accesoInternet.servicioInternet === null
              ? null
              : {
                  id: raw.cuentaPppoe.accesoInternet.servicioInternet.id,

                  nombre:
                    raw.cuentaPppoe.accesoInternet.servicioInternet.nombre,

                  velocidad:
                    raw.cuentaPppoe.accesoInternet.servicioInternet.velocidad,

                  precio:
                    raw.cuentaPppoe.accesoInternet.servicioInternet.precio,

                  estado: String(
                    raw.cuentaPppoe.accesoInternet.servicioInternet.estado,
                  ),
                },
        },
      },

      mikrotikRouter: {
        id: raw.mikrotikRouter.id,

        nombre: raw.mikrotikRouter.nombre,

        host: raw.mikrotikRouter.host,

        sshPort: raw.mikrotikRouter.sshPort,

        descripcion: raw.mikrotikRouter.descripcion,

        activo: raw.mikrotikRouter.activo,
      },

      perfilHomologacion:
        raw.perfilHomologacion === null
          ? null
          : {
              id: raw.perfilHomologacion.id,

              mikrotikRouterId: raw.perfilHomologacion.mikrotikRouterId,

              servicioInternetId: raw.perfilHomologacion.servicioInternetId,

              codigoPerfil: raw.perfilHomologacion.codigoPerfil,

              activo: raw.perfilHomologacion.activo,

              servicioInternet: {
                id: raw.perfilHomologacion.servicioInternet.id,

                nombre: raw.perfilHomologacion.servicioInternet.nombre,

                velocidad: raw.perfilHomologacion.servicioInternet.velocidad,

                precio: raw.perfilHomologacion.servicioInternet.precio,

                estado: String(raw.perfilHomologacion.servicioInternet.estado),
              },
            },

      instalacion:
        raw.instalacion === null
          ? null
          : {
              id: raw.instalacion.id,

              clienteId: raw.instalacion.clienteId,

              servicioInternetId: raw.instalacion.servicioInternetId,

              tipo: String(raw.instalacion.tipo),

              estado: String(raw.instalacion.estado),

              fechaProgramada: this.cloneOptionalDate(
                raw.instalacion.fechaProgramada,
              ),

              fechaInicio: this.cloneOptionalDate(raw.instalacion.fechaInicio),

              fechaFinalizacion: this.cloneOptionalDate(
                raw.instalacion.fechaFinalizacion,
              ),
            },

      desinstalacion:
        raw.desinstalacion === null
          ? null
          : {
              id: raw.desinstalacion.id,

              clienteId: raw.desinstalacion.clienteId,

              servicioInternetId: raw.desinstalacion.servicioInternetId,

              accesoInternetId: raw.desinstalacion.accesoInternetId,

              tipo: String(raw.desinstalacion.tipo),

              motivo:
                raw.desinstalacion.motivo === null
                  ? null
                  : String(raw.desinstalacion.motivo),

              estado: String(raw.desinstalacion.estado),

              fechaProgramada: this.cloneOptionalDate(
                raw.desinstalacion.fechaProgramada,
              ),

              fechaInicio: this.cloneOptionalDate(
                raw.desinstalacion.fechaInicio,
              ),

              fechaFinalizacion: this.cloneOptionalDate(
                raw.desinstalacion.fechaFinalizacion,
              ),
            },

      iniciadoPor:
        raw.iniciadoPor === null
          ? null
          : {
              id: raw.iniciadoPor.id,
              nombre: raw.iniciadoPor.nombre,
              correo: raw.iniciadoPor.correo,
              telefono: raw.iniciadoPor.telefono,
              rol: String(raw.iniciadoPor.rol),
              activo: raw.iniciadoPor.activo,
            },

      reautenticadoPor:
        raw.reautenticadoPor === null
          ? null
          : {
              id: raw.reautenticadoPor.id,
              nombre: raw.reautenticadoPor.nombre,
              correo: raw.reautenticadoPor.correo,
              telefono: raw.reautenticadoPor.telefono,
              rol: String(raw.reautenticadoPor.rol),
              activo: raw.reautenticadoPor.activo,
            },

      reintentoDe:
        raw.reintentoDe === null
          ? null
          : this.toReintentoResumen(raw.reintentoDe),

      conteos: {
        pasos: raw._count.pasos,

        auditorias: raw._count.auditorias,

        reintentos: raw._count.reintentos,
      },
    };
  }

  /**
   * Convierte un payload Prisma enriquecido
   * en el detalle completo.
   */
  static toDetail(
    raw: PppoeOperacionDetailPrismaPayload,
  ): PppoeOperacionDetalle {
    return {
      ...this.toListItem(raw),

      pasos: raw.pasos.map((paso) => this.toPasoReadModel(paso)),

      reintentos: raw.reintentos.map((reintento) =>
        this.toReintentoResumen(reintento),
      ),
    };
  }

  /**
   * Convierte un paso Prisma en read model.
   *
   * Se reutiliza el mapper de dominio para volver
   * a aplicar todas las validaciones de la entidad.
   */
  private static toPasoReadModel(
    raw: PppoeOperacionDetailPrismaPayload['pasos'][number],
  ): PppoeOperacionPasoReadModel {
    const entity = PppoeOperacionPasoPrismaMapper.toDomain(raw);

    const primitives = entity.toPrimitives();

    if (primitives.id === null) {
      throw new Error('Un paso obtenido desde Prisma debe contener id.');
    }

    return {
      id: primitives.id,

      operacionId: primitives.operacionId,

      tipo: primitives.tipo,

      orden: primitives.orden,

      estado: primitives.estado,

      comandoSanitizado: primitives.comandoSanitizado,

      respuestaSanitizada: primitives.respuestaSanitizada,

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,

      iniciadoEn: primitives.iniciadoEn,

      finalizadoEn: primitives.finalizadoEn,

      duracionMs: primitives.duracionMs,

      creadoEn: primitives.creadoEn,

      actualizadoEn: primitives.actualizadoEn,
    };
  }

  /**
   * Convierte una operación reducida en un resumen
   * de reintento.
   */
  private static toReintentoResumen(
    raw:
      | NonNullable<PppoeOperacionListPrismaPayload['reintentoDe']>
      | PppoeOperacionDetailPrismaPayload['reintentos'][number],
  ): PppoeOperacionReintentoResumen {
    return {
      id: raw.id,

      numeroIntento: raw.numeroIntento,

      estado: PppoeOperacionPrismaEnumMapper.estadoOperacionToDomain(
        raw.estado,
      ),

      errorCodigo: raw.errorCodigo,

      errorMensaje: raw.errorMensaje,

      iniciadoEn: this.cloneOptionalDate(raw.iniciadoEn),

      finalizadoEn: this.cloneOptionalDate(raw.finalizadoEn),

      creadoEn: new Date(raw.creadoEn.getTime()),
    };
  }

  /**
   * Convierte un campo Json de Prisma en el objeto
   * aceptado por el read model.
   */
  private static resultadoToDomain(
    value: Prisma.JsonValue | null,
  ): PppoeOperacionResultado | null {
    if (value === null) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('El resultado persistido debe ser un objeto JSON.');
    }

    return JSON.parse(JSON.stringify(value)) as PppoeOperacionResultado;
  }

  /**
   * Clona una fecha opcional.
   */
  private static cloneOptionalDate(value: Date | null): Date | null {
    return value ? new Date(value.getTime()) : null;
  }
}
