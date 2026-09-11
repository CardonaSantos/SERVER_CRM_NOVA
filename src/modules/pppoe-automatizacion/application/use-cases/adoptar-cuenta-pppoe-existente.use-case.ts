import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';

import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import { PPPOE_SECRET_CIPHER } from 'src/modules/pppoe-cliente-cuenta/infra/tokens/pppoe-cliente-cuenta.token';

import { PppoeSecretCipherPort } from 'src/modules/pppoe-credentials/application/ports/pppoe-secret-cipher.port';

import { PerfilHomologacionRepositoryPort } from 'src/modules/pppoe-perfil-homologacion/domain/ports/ppoe-perfil-homologacion.port';

import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from 'src/modules/pppoe-perfil-homologacion/infra/tokens/ppoe-perfil-homologacion.token';

import {
  MIKROTIK_SSH_PORT,
  MikrotikSshPort,
} from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh.port';

import { MikrotikSshSessionPort } from 'src/modules/mikrotik-ssh/domain/ports/mikrotik-ssh-session.port';

import { MetodoAutenticacionMikrotikSsh } from 'src/modules/mikrotik-ssh/domain/enums/mikrotik-ssh.enums';

import { MikrotikRouterConnectionContextPort } from 'src/mikro-tik/domain/ports/mikrotik-router-connection-context.port';

import { MIKROTIK_ROUTER_CONNECTION_CONTEXT } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';

import {
  PPPOE_ADOPCION_PERSISTENCE_PORT,
  PppoeAdopcionPersistencePort,
} from '../../domain/ports/pppoe-adopcion-persistence.port';

import { AdoptarCuentaPppoeExistenteResult } from '../results/adoptar-cuenta-pppoe-existente.result';
import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

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
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoRepository: ClienteAccesoInternetRepositoryPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,

    @Inject(MIKROTIK_ROUTER_CONNECTION_CONTEXT)
    private readonly routerContext: MikrotikRouterConnectionContextPort,

    @Inject(MIKROTIK_SSH_PORT)
    private readonly mikrotikSsh: MikrotikSshPort,

    @Inject(PPPOE_SECRET_CIPHER)
    private readonly secretCipher: PppoeSecretCipherPort,

    @Inject(PPPOE_ADOPCION_PERSISTENCE_PORT)
    private readonly persistence: PppoeAdopcionPersistencePort,
  ) {}

  async execute(
    input: AdoptarCuentaPppoeExistenteInput,
  ): Promise<AdoptarCuentaPppoeExistenteResult> {
    const normalized = this.validateAndNormalizeInput(input);

    /**
     * =======================================================
     * 1. VALIDACIONES LOCALES PREVIAS
     * =======================================================
     *
     * Estas validaciones evitan abrir una conexión SSH
     * cuando ya sabemos que la adopción no puede realizarse.
     */

    const accesoExistente = await this.accesoRepository.findPppoeByClienteId({
      empresaId: normalized.empresaId,

      clienteId: normalized.clienteId,
    });

    if (accesoExistente) {
      throw new ConflictException(
        'El cliente ya posee un acceso PPPoE registrado en el CRM.',
      );
    }

    const cuentaConMismoUsuario = await this.cuentaRepository.findByUsuario(
      normalized.usuarioPppoe,
    );

    if (cuentaConMismoUsuario) {
      throw new ConflictException(
        `El usuario PPPoE "${normalized.usuarioPppoe}" ya se encuentra registrado en el CRM.`,
      );
    }

    /**
     * =======================================================
     * 2. HOMOLOGACIÓN
     * =======================================================
     */

    const perfil = await this.perfilRepository.findById(
      normalized.perfilHomologacionId,
    );

    if (!perfil) {
      throw new NotFoundException(
        `No existe la homologación PPPoE ${normalized.perfilHomologacionId}.`,
      );
    }

    if (perfil.empresaId !== normalized.empresaId) {
      throw new ConflictException(
        'La homologación PPPoE no pertenece a la empresa actual.',
      );
    }

    if (!perfil.estaActiva) {
      throw new ConflictException(
        'La homologación PPPoE seleccionada se encuentra inactiva.',
      );
    }

    const mikrotikRouterId = perfil.mikrotikRouterId;

    const servicioInternetId = perfil.servicioInternetId;

    const codigoPerfilEsperado = perfil.codigoPerfil;

    /**
     * =======================================================
     * 3. RESOLVER ROUTER
     * =======================================================
     */

    const router = await this.routerContext.resolve(mikrotikRouterId);

    /**
     * =======================================================
     * 4. VERIFICACIÓN FINAL CONTRA MIKROTIK
     * =======================================================
     *
     * Esta comprobación NO depende del endpoint previo
     * de "verificar".
     *
     * Aunque el usuario haya hecho una previsualización,
     * aquí volvemos a comprobar todo inmediatamente antes
     * de cifrar y persistir.
     */

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
        throw new ConflictException(
          'La sesión SSH no quedó disponible después de conectarse al MikroTik.',
        );
      }

      const verification = await session.verificarCredencialesSecret({
        usuarioPppoe: normalized.usuarioPppoe,

        passwordPppoe: normalized.passwordPppoe,
      });

      /**
       * Secret inexistente.
       */
      if (!verification.encontrado) {
        throw new ConflictException(
          `No existe un secret PPPoE con el usuario "${normalized.usuarioPppoe}" en el MikroTik seleccionado.`,
        );
      }

      /**
       * Contraseña incorrecta.
       */
      if (verification.passwordCoincide !== true) {
        throw new ConflictException(
          'La contraseña suministrada no coincide con la configurada actualmente en MikroTik.',
        );
      }

      if (!verification.secret) {
        throw new ConflictException(
          'MikroTik confirmó el usuario, pero no devolvió la información necesaria para completar la adopción.',
        );
      }

      /**
       * El profile remoto debe coincidir exactamente
       * con la homologación elegida.
       */
      if (verification.secret.codigoPerfil !== codigoPerfilEsperado) {
        throw new ConflictException(
          `El secret utiliza el profile "${verification.secret.codigoPerfil ?? 'sin perfil'}", pero la homologación seleccionada requiere "${codigoPerfilEsperado}".`,
        );
      }

      servicioRemoto = verification.secret.servicio;

      if (!this.isCompatibleService(servicioRemoto)) {
        throw new ConflictException(
          `El secret utiliza service="${servicioRemoto ?? 'sin servicio'}", por lo que no puede adoptarse como cuenta PPPoE.`,
        );
      }

      deshabilitado = verification.secret.deshabilitado;
    } finally {
      await this.closeSessionSafely(session);
    }

    /**
     * =======================================================
     * 5. DETERMINAR ESTADO REAL
     * =======================================================
     */

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

    /**
     * =======================================================
     * 6. CIFRAR EXACTAMENTE LA MISMA CONTRASEÑA
     * =======================================================
     *
     * No generamos una contraseña nueva.
     *
     * No modificamos MikroTik.
     *
     * Ciframos exactamente la contraseña que acaba
     * de comprobarse contra RouterOS.
     */

    const secretoProtegido = await this.secretCipher.encrypt(
      normalized.passwordPppoe,
    );

    const fechaAdopcion = normalized.fechaReferencia
      ? new Date(normalized.fechaReferencia)
      : new Date();

    /**
     * =======================================================
     * 7. PERSISTENCIA ATÓMICA
     * =======================================================
     */

    const persisted = await this.persistence.persistir({
      empresaId: normalized.empresaId,

      clienteId: normalized.clienteId,

      servicioInternetId,

      perfilHomologacionId: normalized.perfilHomologacionId,

      mikrotikRouterId,

      usuarioPppoe: normalized.usuarioPppoe,

      secretoProtegido,

      estado,

      adoptadoPorId: normalized.operadorId,

      fechaAdopcion,

      auditoria: {
        codigoPerfil: codigoPerfilEsperado,

        servicioRemoto,

        cumpleFormatoNova,
      },
    });

    const advertencias: string[] = [];

    /**
     * service=any funciona para PPPoE,
     * pero las nuevas cuentas utilizan pppoe.
     */
    if (servicioRemoto?.trim().toLowerCase() === 'any') {
      advertencias.push(
        'El secret utiliza service=any. Es compatible con PPPoE, aunque las cuentas nuevas del CRM utilizan service=pppoe.',
      );
    }

    /**
     * Una contraseña histórica puede conservarse
     * aunque no utilice el formato actual.
     */
    if (!cumpleFormatoNova) {
      advertencias.push(
        'La contraseña adoptada no utiliza la nomenclatura actual de NOVA. Se conservó sin modificaciones porque coincide con MikroTik.',
      );
    }

    return {
      empresaId: persisted.empresaId,

      clienteId: persisted.clienteId,

      accesoInternetId: persisted.accesoInternetId,

      cuentaPppoeId: persisted.cuentaPppoeId,

      perfilHomologacionId: persisted.perfilHomologacionId,

      mikrotikRouterId: persisted.mikrotikRouterId,

      servicioInternetId: persisted.servicioInternetId,

      usuarioPppoe: persisted.usuarioPppoe,

      estadoCuenta: persisted.estadoCuenta,

      estadoAcceso: persisted.estadoAcceso,

      adoptadoPorId: persisted.adoptadoPorId,

      adoptadoEn: persisted.adoptadoEn,

      auditoriaId: persisted.auditoriaId,

      cumpleFormatoNova,

      advertencias,
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
      throw new BadRequestException('usuarioPppoe debe ser una cadena.');
    }

    const usuarioPppoe = input.usuarioPppoe.trim();

    if (!usuarioPppoe) {
      throw new BadRequestException('usuarioPppoe es obligatorio.');
    }

    if (
      usuarioPppoe.length >
      AdoptarCuentaPppoeExistenteUseCase.MAX_USUARIO_LENGTH
    ) {
      throw new BadRequestException(
        `usuarioPppoe no puede superar ${AdoptarCuentaPppoeExistenteUseCase.MAX_USUARIO_LENGTH} caracteres.`,
      );
    }

    /**
     * La contraseña NO se trimmea.
     *
     * Debemos comparar exactamente el valor
     * utilizado históricamente en MikroTik.
     */
    if (
      typeof input.passwordPppoe !== 'string' ||
      input.passwordPppoe.length === 0
    ) {
      throw new BadRequestException('passwordPppoe es obligatorio.');
    }

    if (
      input.passwordPppoe.length >
      AdoptarCuentaPppoeExistenteUseCase.MAX_PASSWORD_LENGTH
    ) {
      throw new BadRequestException(
        `passwordPppoe no puede superar ${AdoptarCuentaPppoeExistenteUseCase.MAX_PASSWORD_LENGTH} caracteres.`,
      );
    }

    if (
      input.fechaReferencia !== undefined &&
      (!(input.fechaReferencia instanceof Date) ||
        Number.isNaN(input.fechaReferencia.getTime()))
    ) {
      throw new BadRequestException(
        'fechaReferencia debe ser una fecha válida.',
      );
    }

    return {
      ...input,

      usuarioPppoe,

      /**
       * Se conserva exactamente como llegó.
       */
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
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
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
      /**
       * No sustituimos el resultado principal
       * por un error secundario de cierre.
       */
    }
  }
}
