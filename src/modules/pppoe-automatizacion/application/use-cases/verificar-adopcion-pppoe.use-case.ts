import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';

import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';

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

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import {
  EstadoRemotoAdopcionPppoe,
  VerificarAdopcionPppoeResult,
} from '../results/verificar-adopcion-pppoe.result';

export type VerificarAdopcionPppoeInput = {
  empresaId: number;

  clienteId: number;

  /**
   * Homologación seleccionada por el operador.
   *
   * De aquí obtenemos:
   *
   * - router;
   * - servicio;
   * - código de profile esperado.
   */
  perfilHomologacionId: number;

  /**
   * Usuario libre.
   *
   * NO se deriva del clienteId.
   */
  usuarioPppoe: string;

  /**
   * Contraseña actualmente configurada
   * en el MikroTik.
   *
   * Nunca debe registrarse.
   */
  passwordPppoe: string;
};

@Injectable()
export class VerificarAdopcionPppoeUseCase {
  private static readonly MAX_USUARIO_LENGTH = 255;

  private static readonly MAX_PASSWORD_LENGTH = 512;

  /**
   * Formato generado actualmente por NOVA:
   *
   * NV-2026/09/10MH11:45#
   *
   * Esta comprobación es únicamente informativa.
   * Las cuentas históricas pueden utilizar otra contraseña.
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
  ) {}

  async execute(
    input: VerificarAdopcionPppoeInput,
  ): Promise<VerificarAdopcionPppoeResult> {
    const normalized = this.validateAndNormalizeInput(input);

    /**
     * ==========================================================
     * 1. COMPROBAR QUE EL CLIENTE TODAVÍA NO ESTÉ ADMINISTRADO
     * ==========================================================
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

    /**
     * El username PPPoE también debe estar libre localmente.
     *
     * El repositorio ya posee findByUsuario(), así que
     * evitamos adoptar un secret asociado previamente.
     */
    const cuentaConMismoUsuario = await this.cuentaRepository.findByUsuario(
      normalized.usuarioPppoe,
    );

    if (cuentaConMismoUsuario) {
      throw new ConflictException(
        `El usuario PPPoE "${normalized.usuarioPppoe}" ya está asociado a una cuenta dentro del CRM.`,
      );
    }

    /**
     * ==========================================================
     * 2. RESOLVER HOMOLOGACIÓN
     * ==========================================================
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

    /**
     * El router y servicio NO llegan libremente desde el request.
     *
     * Se derivan de la homologación seleccionada.
     */
    const mikrotikRouterId = perfil.mikrotikRouterId;

    const servicioInternetId = perfil.servicioInternetId;

    const perfilEsperado = perfil.codigoPerfil;

    /**
     * ==========================================================
     * 3. RESOLVER CREDENCIALES DEL ROUTER
     * ==========================================================
     */
    const router = await this.routerContext.resolve(mikrotikRouterId);

    let session: MikrotikSshSessionPort | null = null;

    try {
      /**
       * ========================================================
       * 4. ABRIR SESIÓN SSH
       * ========================================================
       */
      session = await this.mikrotikSsh.abrirSesion({
        host: router.host,

        port: router.port,

        username: router.username,

        autenticacion: {
          metodo: MetodoAutenticacionMikrotikSsh.PASSWORD,

          password: router.password,
        },

        /**
         * Conservamos por ahora la misma política
         * utilizada por los executors PPPoE existentes.
         */
        verificacionHost: {
          verificar: false,
        },
      });

      if (!session.estaAbierta()) {
        throw new ConflictException(
          'La sesión SSH no quedó disponible después de conectarse al MikroTik.',
        );
      }

      /**
       * ========================================================
       * 5. COMPROBAR CREDENCIALES REALES
       * ========================================================
       */
      const verification = await session.verificarCredencialesSecret({
        usuarioPppoe: normalized.usuarioPppoe,

        passwordPppoe: normalized.passwordPppoe,
      });

      return this.buildResult({
        empresaId: normalized.empresaId,

        clienteId: normalized.clienteId,

        perfilHomologacionId: normalized.perfilHomologacionId,

        mikrotikRouterId,

        servicioInternetId,

        usuarioPppoe: normalized.usuarioPppoe,

        passwordPppoe: normalized.passwordPppoe,

        perfilEsperado,

        encontrado: verification.encontrado,

        passwordCoincide: verification.passwordCoincide,

        perfilEncontrado: verification.secret?.codigoPerfil ?? null,

        servicioEncontrado: verification.secret?.servicio ?? null,

        deshabilitado: verification.secret?.deshabilitado ?? null,
      });
    } finally {
      await this.closeSessionSafely(session);
    }
  }

  private buildResult(params: {
    empresaId: number;

    clienteId: number;

    perfilHomologacionId: number;

    mikrotikRouterId: number;

    servicioInternetId: number;

    usuarioPppoe: string;

    /**
     * Solo se utiliza aquí para determinar si
     * cumple la nomenclatura NOVA.
     *
     * Nunca forma parte del resultado.
     */
    passwordPppoe: string;

    perfilEsperado: string;

    encontrado: boolean;

    passwordCoincide: boolean | null;

    perfilEncontrado: string | null;

    servicioEncontrado: string | null;

    deshabilitado: boolean | null;
  }): VerificarAdopcionPppoeResult {
    const perfilCoincide = params.encontrado
      ? params.perfilEncontrado === params.perfilEsperado
      : null;

    const servicioCompatible = params.encontrado
      ? this.isCompatibleService(params.servicioEncontrado)
      : null;

    const estadoRemoto =
      params.encontrado && params.deshabilitado !== null
        ? this.resolveRemoteState(params.deshabilitado)
        : null;

    /**
     * Solamente podemos clasificar la nomenclatura
     * después de demostrar que la contraseña escrita
     * es realmente la contraseña remota.
     */
    const cumpleFormatoNova =
      params.passwordCoincide === true
        ? VerificarAdopcionPppoeUseCase.NOVA_PASSWORD_PATTERN.test(
            params.passwordPppoe,
          )
        : null;

    const puedeAdoptar =
      params.encontrado &&
      params.passwordCoincide === true &&
      perfilCoincide === true &&
      servicioCompatible === true;

    const advertencias = this.buildWarnings({
      encontrado: params.encontrado,

      passwordCoincide: params.passwordCoincide,

      perfilEsperado: params.perfilEsperado,

      perfilEncontrado: params.perfilEncontrado,

      servicioEncontrado: params.servicioEncontrado,

      servicioCompatible,

      cumpleFormatoNova,
    });

    return {
      empresaId: params.empresaId,

      clienteId: params.clienteId,

      perfilHomologacionId: params.perfilHomologacionId,

      mikrotikRouterId: params.mikrotikRouterId,

      servicioInternetId: params.servicioInternetId,

      usuarioPppoe: params.usuarioPppoe,

      encontrado: params.encontrado,

      passwordCoincide: params.passwordCoincide,

      perfilEsperado: params.perfilEsperado,

      perfilEncontrado: params.perfilEncontrado,

      perfilCoincide,

      servicioEncontrado: params.servicioEncontrado,

      servicioCompatible,

      deshabilitado: params.deshabilitado,

      estadoRemoto,

      cumpleFormatoNova,

      puedeAdoptar,

      advertencias,
    };
  }

  private buildWarnings(params: {
    encontrado: boolean;

    passwordCoincide: boolean | null;

    perfilEsperado: string;

    perfilEncontrado: string | null;

    servicioEncontrado: string | null;

    servicioCompatible: boolean | null;

    cumpleFormatoNova: boolean | null;
  }): string[] {
    const warnings: string[] = [];

    if (!params.encontrado) {
      warnings.push(
        'No se encontró un secret PPPoE con el usuario suministrado.',
      );

      return warnings;
    }

    if (params.passwordCoincide === false) {
      warnings.push(
        'El usuario PPPoE existe, pero la contraseña suministrada no coincide.',
      );
    }

    if (params.perfilEncontrado !== params.perfilEsperado) {
      warnings.push(
        `El profile remoto "${params.perfilEncontrado ?? 'sin perfil'}" no coincide con la homologación esperada "${params.perfilEsperado}".`,
      );
    }

    if (params.servicioCompatible === false) {
      warnings.push(
        `El service remoto "${params.servicioEncontrado ?? 'sin servicio'}" no es compatible con PPPoE.`,
      );
    }

    /**
     * RouterOS permite service=any.
     *
     * Técnicamente funciona para PPPoE, así que NO bloqueamos
     * la adopción, pero dejamos constancia informativa.
     */
    if (
      params.servicioCompatible === true &&
      params.servicioEncontrado?.trim().toLowerCase() === 'any'
    ) {
      warnings.push(
        'El secret utiliza service=any. Es compatible con PPPoE, aunque las cuentas nuevas del CRM utilizan service=pppoe.',
      );
    }

    /**
     * Las credenciales históricas no estándar son válidas
     * siempre que hayan sido comprobadas contra MikroTik.
     */
    if (params.cumpleFormatoNova === false) {
      warnings.push(
        'La contraseña coincide con MikroTik, pero no utiliza la nomenclatura actual de NOVA. Esto no impide la adopción.',
      );
    }

    return warnings;
  }

  private isCompatibleService(value: string | null): boolean {
    if (!value) {
      return false;
    }

    const normalized = value.trim().toLowerCase();

    return normalized === 'pppoe' || normalized === 'any';
  }

  private resolveRemoteState(
    deshabilitado: boolean,
  ): EstadoRemotoAdopcionPppoe {
    return deshabilitado
      ? EstadoCuentaPppoe.SUSPENDIDA
      : EstadoCuentaPppoe.ACTIVA;
  }

  private validateAndNormalizeInput(
    input: VerificarAdopcionPppoeInput,
  ): VerificarAdopcionPppoeInput {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.clienteId, 'clienteId');

    this.assertPositiveInteger(
      input.perfilHomologacionId,
      'perfilHomologacionId',
    );

    if (typeof input.usuarioPppoe !== 'string') {
      throw new BadRequestException('usuarioPppoe debe ser una cadena.');
    }

    const usuarioPppoe = input.usuarioPppoe.trim();

    if (!usuarioPppoe) {
      throw new BadRequestException('usuarioPppoe es obligatorio.');
    }

    if (
      usuarioPppoe.length > VerificarAdopcionPppoeUseCase.MAX_USUARIO_LENGTH
    ) {
      throw new BadRequestException(
        `usuarioPppoe no puede superar ${VerificarAdopcionPppoeUseCase.MAX_USUARIO_LENGTH} caracteres.`,
      );
    }

    /**
     * La contraseña NO se trimmea.
     *
     * Un espacio podría formar parte legítimamente de una
     * contraseña histórica y debemos comparar exactamente
     * lo escrito con MikroTik.
     */
    if (
      typeof input.passwordPppoe !== 'string' ||
      input.passwordPppoe.length === 0
    ) {
      throw new BadRequestException('passwordPppoe es obligatorio.');
    }

    if (
      input.passwordPppoe.length >
      VerificarAdopcionPppoeUseCase.MAX_PASSWORD_LENGTH
    ) {
      throw new BadRequestException(
        `passwordPppoe no puede superar ${VerificarAdopcionPppoeUseCase.MAX_PASSWORD_LENGTH} caracteres.`,
      );
    }

    return {
      ...input,

      usuarioPppoe,

      /**
       * Se conserva exactamente.
       */
      passwordPppoe: input.passwordPppoe,
    };
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  /**
   * Seguimos la misma política de los executors actuales:
   * un fallo secundario cerrando SSH no sustituye el
   * resultado principal de la comprobación.
   */
  private async closeSessionSafely(
    session: MikrotikSshSessionPort | null,
  ): Promise<void> {
    if (!session) {
      return;
    }

    try {
      await session.cerrar();
    } catch {
      // No propagamos errores secundarios de cierre.
    }
  }
}
