import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { Inject, Injectable } from '@nestjs/common';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  PPPOE_SECRET_CIPHER,
  PppoeSecretCipherPort,
  SecretoPppoeProtegido,
} from 'src/modules/pppoe-credentials/public/pppoe-secret-cipher.port';
import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/public/mikrotik-ssh.port';
import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/public/mikrotik-ssh-session.port';
import { MetodoAutenticacionMikrotikSsh } from 'src/modules/mikrotik-ssh/public/mikrotik-ssh.types';
import { MikrotikRouterConnectionContextPort } from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';
import { MIKROTIK_ROUTER_CONNECTION_CONTEXT } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import {
  PPPOE_AUDITORIA,
  PppoeAuditoriaFacadePort,
} from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.facade.port';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
import {
  PPPOE_ACCESO_INTERNET,
  PppoeAccesoInternetFacadePort,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.facade.port';
import {
  PPPOE_PERFIL_HOMOLOGACION,
  PppoePerfilHomologacionFacadePort,
} from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.facade.port';
import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/public/pppoe-acceso-internet.types';
import {
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
  UsuarioPppoeEnUsoError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { PerfilHomologacionNoEncontradoError } from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.types';

export type AdoptarCuentaPppoeExistenteInput = {
  empresaId: number;

  clienteId: number;

  perfilHomologacionId: number;

  /**
   * Nombre exacto del secret ya existente.
   *
   * Es libre.
   * NO se deriva del clienteId.
   */
  usuarioPppoe: string;

  /**
   * Contraseña exacta actualmente configurada
   * en MikroTik.
   *
   * No se trimmea.
   * No se registra.
   * No se audita.
   */
  passwordPppoe: string;

  /**
   * Operador autenticado que ejecuta
   * la adopción.
   */
  operadorId: number;

  /**
   * Útil para pruebas deterministas.
   */
  fechaReferencia?: Date;
};

@Injectable()
export class AdoptarCuentaPppoeExistenteUseCase {
  private static readonly MAX_USUARIO_LENGTH = 128;

  private static readonly MAX_PASSWORD_LENGTH = 512;

  /**
   * Formato utilizado actualmente por las
   * contraseñas generadas por NOVA.
   *
   * Es únicamente informativo para adopciones.
   */
  private static readonly NOVA_PASSWORD_PATTERN =
    /^NV-\d{4}\/\d{2}\/\d{2}MH(?:[01]\d|2[0-3]):[0-5]\d#$/;

  constructor(
    @Inject(RELOJ) private readonly reloj: RelojPort,
    @Inject(PPPOE_ACCESO_INTERNET)
    private readonly accesosInternet: PppoeAccesoInternetFacadePort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    @Inject(PPPOE_PERFIL_HOMOLOGACION)
    private readonly perfilesHomologacion: PppoePerfilHomologacionFacadePort,

    @Inject(MIKROTIK_ROUTER_CONNECTION_CONTEXT)
    private readonly routerContext: MikrotikRouterConnectionContextPort,

    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(PPPOE_AUDITORIA)
    private readonly auditorias: PppoeAuditoriaFacadePort,

    @Inject(UNIDAD_DE_TRABAJO)
    private readonly unidadDeTrabajo: UnidadDeTrabajoPort,
  ) {}

  async execute(
    input: AdoptarCuentaPppoeExistenteInput,
  ): Promise<AdoptarCuentaPppoeExistenteResult> {
    const normalized = this.validateAndNormalizeInput(input);

    const accesoVigente =
      await this.accesosInternet.buscarPppoeVigenteDelCliente(
        normalized.clienteId,
      );

    if (accesoVigente) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `El cliente ya posee un acceso PPPoE vigente en estado ${accesoVigente.estado}.`,
      );
    }

    const cuentaVigenteConMismoUsuario =
      await this.cuentasPppoe.buscarVigentePorUsuario(normalized.usuarioPppoe);

    if (cuentaVigenteConMismoUsuario) {
      throw new UsuarioPppoeEnUsoError(
        `El usuario PPPoE "${normalized.usuarioPppoe}" ya se encuentra asociado a una cuenta vigente en el CRM.`,
      );
    }

    const perfil = await this.perfilesHomologacion.buscarPorId(
      normalized.perfilHomologacionId,
    );

    if (!perfil) {
      throw new PerfilHomologacionNoEncontradoError();
    }

    if (!perfil.activo) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación PPPoE seleccionada se encuentra inactiva.',
      );
    }

    const mikrotikRouterId = perfil.mikrotikRouterId;

    const servicioInternetId = perfil.servicioInternetId;

    const codigoPerfilEsperado = perfil.codigoPerfil;

    const router = await this.routerContext.resolve(mikrotikRouterId);

    let session: MikrotikSshSessionPort | null = null;

    let deshabilitado: boolean;

    let servicioRemoto: string | null;

    try {
      session = await this.mikrotikSsh.abrirSesion({
        host: router.host,

        port: router.port,

        username: router.username,

        autenticacion: {
          metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

          password: router.password,
        },

        verificacionHost: {
          verificar: false,
        },
      });

      if (!session.estaAbierta()) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          'La sesión SSH no quedó disponible después de conectarse al MikroTik.',
        );
      }

      const verification = await session.verificarCredencialesSecret({
        usuarioPppoe: normalized.usuarioPppoe,

        passwordPppoe: normalized.passwordPppoe,
      });

      if (!verification.encontrado) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `No existe un secret PPPoE con el usuario "${normalized.usuarioPppoe}" en el MikroTik seleccionado.`,
        );
      }

      if (verification.passwordCoincide !== true) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          'La contraseña suministrada no coincide con la configurada actualmente en MikroTik.',
        );
      }

      if (!verification.secret) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          'MikroTik confirmó el usuario, pero no devolvió la información necesaria para completar la adopción.',
        );
      }

      if (verification.secret.codigoPerfil !== codigoPerfilEsperado) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `El secret utiliza el profile "${verification.secret.codigoPerfil ?? 'sin perfil'}", pero la homologación seleccionada requiere "${codigoPerfilEsperado}".`,
        );
      }

      servicioRemoto = verification.secret.servicio;

      if (!this.isCompatibleService(servicioRemoto)) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `El secret utiliza service="${servicioRemoto ?? 'sin servicio'}", por lo que no puede adoptarse como cuenta PPPoE.`,
        );
      }

      deshabilitado = verification.secret.deshabilitado;
    } finally {
      await this.closeSessionSafely(session);
    }

    const estado = deshabilitado
      ? {
          estadoCuenta: EstadoCuentaPppoe.SUSPENDIDA as const,

          estadoAcceso: EstadoAccesoInternet.SUSPENDIDO as const,
        }
      : {
          estadoCuenta: EstadoCuentaPppoe.ACTIVA as const,

          estadoAcceso: EstadoAccesoInternet.ACTIVO as const,
        };

    const cumpleFormatoNova =
      AdoptarCuentaPppoeExistenteUseCase.NOVA_PASSWORD_PATTERN.test(
        normalized.passwordPppoe,
      );

    const secretoProtegido = await this.secretCipher.encrypt(
      normalized.passwordPppoe,
    );

    const fechaAdopcion = normalized.fechaReferencia
      ? new Date(normalized.fechaReferencia)
      : this.reloj.ahora();

    const persistida = await this.unidadDeTrabajo.ejecutar(
      () =>
        this.registrarAdopcion({
          normalized,
          servicioInternetId,
          estado,
          secretoProtegido,
          fechaAdopcion,
          auditoria: {
            tipo: 'ADOPCION_CUENTA_EXISTENTE',
            mikrotikRouterId,
            servicioInternetId,
            servicioRemoto,
            cumpleFormatoNova,
            estadoCuentaRemoto: estado.estadoCuenta,
            estadoAccesoRemoto: estado.estadoAcceso,
            modificacionRemota: false,
          },
          codigoPerfil: codigoPerfilEsperado,
        }),
      // Dos adopciones simultáneas del mismo cliente o usuario no deben pasar.
      { aislamiento: 'SERIALIZABLE' },
    );

    const advertencias: string[] = [];

    if (servicioRemoto?.trim().toLowerCase() === 'any') {
      advertencias.push(
        'El secret utiliza service=any. Es compatible con PPPoE, aunque las cuentas nuevas del CRM utilizan service=pppoe.',
      );
    }

    if (!cumpleFormatoNova) {
      advertencias.push(
        'La contraseña adoptada no utiliza la nomenclatura actual de NOVA. Se conservó sin modificaciones porque coincide con MikroTik.',
      );
    }

    return {
      empresaId: normalized.empresaId,
      clienteId: normalized.clienteId,
      accesoInternetId: persistida.accesoInternetId,
      cuentaPppoeId: persistida.cuentaPppoeId,
      perfilHomologacionId: normalized.perfilHomologacionId,
      mikrotikRouterId,
      servicioInternetId,
      usuarioPppoe: normalized.usuarioPppoe,
      estadoCuenta: estado.estadoCuenta,
      estadoAcceso: estado.estadoAcceso,
      adoptadoPorId: normalized.operadorId,
      adoptadoEn: fechaAdopcion,
      auditoriaId: persistida.auditoriaId,

      cumpleFormatoNova,

      advertencias,
    };
  }

  /**
   * Corre dentro de la unidad de trabajo: vuelve a comprobar que el cliente y
   * el usuario sigan libres y registra acceso, cuenta y auditoría a la vez.
   */
  private async registrarAdopcion(params: {
    normalized: AdoptarCuentaPppoeExistenteInput;
    servicioInternetId: number;
    estado: {
      estadoCuenta: EstadoCuentaPppoe.ACTIVA | EstadoCuentaPppoe.SUSPENDIDA;
      estadoAcceso:
        | EstadoAccesoInternet.ACTIVO
        | EstadoAccesoInternet.SUSPENDIDO;
    };
    secretoProtegido: SecretoPppoeProtegido;
    fechaAdopcion: Date;
    codigoPerfil: string;
    auditoria: Record<string, string | number | boolean | null>;
  }): Promise<{
    accesoInternetId: number;
    cuentaPppoeId: number;
    auditoriaId: number;
  }> {
    const { normalized, estado, fechaAdopcion } = params;

    const accesoVigente =
      await this.accesosInternet.buscarPppoeVigenteDelCliente(
        normalized.clienteId,
      );
    if (accesoVigente) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `El cliente ya posee un acceso PPPoE vigente en estado ${accesoVigente.estado}.`,
      );
    }
    if (
      await this.cuentasPppoe.buscarVigentePorUsuario(normalized.usuarioPppoe)
    ) {
      throw new UsuarioPppoeEnUsoError(
        `El usuario PPPoE "${normalized.usuarioPppoe}" ya se encuentra asociado a una cuenta vigente en el CRM.`,
      );
    }

    const acceso = await this.accesosInternet.registrarAdoptado({
      empresaId: normalized.empresaId,
      clienteId: normalized.clienteId,
      servicioInternetId: params.servicioInternetId,
      tecnologia: TecnologiaAccesoInternet.FIBRA_GPON,
      metodoAutenticacion: MetodoAutenticacionInternet.PPPOE,
      estadoRemoto: estado.estadoAcceso,
      fechaAdopcion,
    });

    const cuenta = await this.cuentasPppoe.registrarAdoptada({
      empresaId: normalized.empresaId,
      accesoInternetId: acceso.id,
      perfilHomologacionId: normalized.perfilHomologacionId,
      usuario: normalized.usuarioPppoe,
      ...params.secretoProtegido,
      estadoRemoto: estado.estadoCuenta,
      adoptadoPorId: normalized.operadorId,
      fechaAdopcion,
    });

    // Sin contraseña ni material cifrado en la auditoría.
    const auditoriaId = await this.auditorias.registrarEventoCuenta({
      empresaId: normalized.empresaId,
      clienteId: normalized.clienteId,
      accesoInternetId: acceso.id,
      cuentaPppoeId: cuenta.id,
      perfilHomologacionId: normalized.perfilHomologacionId,
      operadorId: normalized.operadorId,
      origen: OrigenOperacionPppoe.OPERADOR,
      accion: AccionAuditoriaPppoe.CUENTA_EXTERNA_ADOPTADA,
      descripcion:
        'Cuenta PPPoE preexistente verificada y adoptada por el CRM sin modificar MikroTik.',
      estadoCuentaAnterior: null,
      estadoCuentaNuevo: estado.estadoCuenta,
      usuarioPppoeSnapshot: normalized.usuarioPppoe,
      perfilCodigoSnapshot: params.codigoPerfil,
      datos: params.auditoria,
      creadoEn: fechaAdopcion,
    });

    return {
      accesoInternetId: acceso.id,
      cuentaPppoeId: cuenta.id,
      auditoriaId,
    };
  }

  private validateAndNormalizeInput(
    input: AdoptarCuentaPppoeExistenteInput,
  ): AdoptarCuentaPppoeExistenteInput {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.clienteId, 'clienteId');

    this.assertPositiveInteger(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    this.assertPositiveInteger(input.operadorId, 'operadorId');

    if (typeof input.usuarioPppoe !== 'string') {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'usuarioPppoe debe ser una cadena.',
      );
    }

    const usuarioPppoe = input.usuarioPppoe.trim();

    if (!usuarioPppoe) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'usuarioPppoe es obligatorio.',
      );
    }

    if (
      usuarioPppoe.length >
      AdoptarCuentaPppoeExistenteUseCase.MAX_USUARIO_LENGTH
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `usuarioPppoe no puede superar ${AdoptarCuentaPppoeExistenteUseCase.MAX_USUARIO_LENGTH} caracteres.`,
      );
    }

    if (
      typeof input.passwordPppoe !== 'string' ||
      input.passwordPppoe.length === 0
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'passwordPppoe es obligatorio.',
      );
    }

    if (
      input.passwordPppoe.length >
      AdoptarCuentaPppoeExistenteUseCase.MAX_PASSWORD_LENGTH
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `passwordPppoe no puede superar ${AdoptarCuentaPppoeExistenteUseCase.MAX_PASSWORD_LENGTH} caracteres.`,
      );
    }

    if (
      input.fechaReferencia !== undefined &&
      (!(input.fechaReferencia instanceof Date) ||
        Number.isNaN(input.fechaReferencia.getTime()))
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'fechaReferencia debe ser una fecha válida.',
      );
    }

    return {
      ...input,

      usuarioPppoe,

      passwordPppoe: input.passwordPppoe,
    };
  }

  private isCompatibleService(value: string | null): boolean {
    if (!value) {
      return false;
    }

    const normalized = value.trim().toLowerCase();

    return normalized === 'pppoe' || normalized === 'any';
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private async closeSessionSafely(
    session: MikrotikSshSessionPort | null,
  ): Promise<void> {
    if (!session) {
      return;
    }

    try {
      await session.cerrar();
    } catch {
      return;
    }
  }
}

/**
 * Resultado seguro de adoptar una cuenta PPPoE
 * que ya existía previamente en MikroTik.
 *
 * Nunca contiene contraseña ni material criptográfico.
 */
export type AdoptarCuentaPppoeExistenteResult = {
  empresaId: number;

  clienteId: number;

  accesoInternetId: number;

  cuentaPppoeId: number;

  perfilHomologacionId: number;

  mikrotikRouterId: number;

  servicioInternetId: number;

  usuarioPppoe: string;

  estadoCuenta: EstadoCuentaPppoe;

  estadoAcceso: EstadoAccesoInternet;

  adoptadoPorId: number;

  adoptadoEn: Date;

  auditoriaId: number;

  /**
   * Indica si la contraseña adoptada utiliza
   * la nomenclatura actual de NOVA.
   *
   * false NO invalida la adopción.
   */
  cumpleFormatoNova: boolean;

  advertencias: string[];
};
