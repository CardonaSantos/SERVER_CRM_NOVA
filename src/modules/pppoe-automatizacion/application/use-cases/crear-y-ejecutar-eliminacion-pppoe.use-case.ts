import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionRepositoryPort,
} from 'src/modules/pppoe-operacion/domain/ports/pppoe-operacion-repository.port';

import { PerfilHomologacionRepositoryPort } from 'src/modules/pppoe-perfil-homologacion/domain/ports/ppoe-perfil-homologacion.port';

import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from 'src/modules/pppoe-perfil-homologacion/infra/tokens/ppoe-perfil-homologacion.token';

import { MikrotikRouterRepositoryPort } from 'src/mikro-tik/domain/ports/mikrotik-router-repository.port';

import { MIKROTIK_ROUTER_REPOSITORY } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';

import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../../domain/ports/pppoe-operacion-auditoria.port';

import {
  EjecutarOperacionPppoeResult,
  EliminarSecretPppoeInput,
} from '../../domain/props/pppoe-provisionamiento.props';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';
import { CrearPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/crear-pppoe-operacion.use-case.ts';

/**
 * Crea y ejecuta una operación ELIMINAR_SECRET.
 *
 * La desinstalación recibida debe representar un flujo
 * previamente autorizado por el dominio de negocio.
 *
 * Por esa razón no se solicita una segunda
 * reautenticación dentro de este caso de uso.
 */
@Injectable()
export class CrearYEjecutarEliminacionPppoeUseCase {
  constructor(
    private readonly crearOperacion: CrearPppoeOperacionUseCase,

    private readonly ejecutarOperacion: EjecutarPppoeOperacionUseCase,

    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly operacionRepository: PppoeOperacionRepositoryPort,

    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,

    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly routerRepository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(
    input: EliminarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    /*
     * ========================================================
     * 1. CUENTA PPPoE
     * ========================================================
     */

    const cuenta = await this.cuentaRepository.findById(input.cuentaPppoeId);

    if (!cuenta) {
      throw new NotFoundException(
        `No existe la cuenta PPPoE ${input.cuentaPppoeId}.`,
      );
    }

    if (cuenta.id === null) {
      throw new ConflictException(
        'La cuenta PPPoE no contiene un identificador persistido.',
      );
    }

    if (cuenta.empresaId !== input.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece a la empresa indicada.',
      );
    }

    /*
     * ========================================================
     * 2. HOMOLOGACIÓN
     * ========================================================
     */

    const perfil = await this.perfilRepository.findById(
      cuenta.perfilHomologacionId,
    );

    if (!perfil) {
      throw new NotFoundException(
        `No existe la homologación PPPoE ${cuenta.perfilHomologacionId}.`,
      );
    }

    const perfilProps = perfil.toPrimitives();

    if (perfilProps.id === null) {
      throw new ConflictException(
        'La homologación PPPoE no contiene un identificador persistido.',
      );
    }

    if (perfilProps.id !== cuenta.perfilHomologacionId) {
      throw new ConflictException(
        'La homologación recuperada no coincide con la cuenta PPPoE.',
      );
    }

    if (perfilProps.empresaId !== input.empresaId) {
      throw new ConflictException(
        'La homologación PPPoE no pertenece a la empresa indicada.',
      );
    }

    /*
     * ========================================================
     * 3. ROUTER MIKROTIK
     * ========================================================
     */

    const router = await this.routerRepository.findById(
      perfilProps.mikrotikRouterId,
    );

    if (!router) {
      throw new NotFoundException(
        `No existe el router MikroTik ${perfilProps.mikrotikRouterId}.`,
      );
    }

    if (router.id === null) {
      throw new ConflictException(
        'El router MikroTik no contiene un identificador persistido.',
      );
    }

    if (router.empresaId !== input.empresaId) {
      throw new ConflictException(
        'El router MikroTik no pertenece a la empresa indicada.',
      );
    }

    /*
     * ========================================================
     * 4. IDEMPOTENCIA PREVIA
     * ========================================================
     */

    const existingOperation =
      await this.operacionRepository.findByIdempotencyKey({
        empresaId: input.empresaId,

        claveIdempotencia: input.claveIdempotencia,
      });

    if (existingOperation) {
      this.assertCompatibleExistingOperation({
        input,

        operacion: existingOperation,

        routerId: router.id,
      });

      return this.resolveOperation({
        empresaId: input.empresaId,

        operacion: existingOperation,

        estadoCuenta: cuenta.estado,
      });
    }

    /*
     * Una nueva intención no puede iniciarse cuando la
     * cuenta ya fue eliminada.
     *
     * La repetición idempotente de una operación anterior
     * se resolvió antes de esta validación.
     */
    this.assertAccountCanBeDeleted(cuenta.estado);

    /*
     * ========================================================
     * 5. CREAR OPERACIÓN
     * ========================================================
     */

    const aggregate = await this.crearOperacion.execute({
      empresaId: input.empresaId,

      cuentaPppoeId: cuenta.id,

      mikrotikRouterId: router.id,

      perfilHomologacionId: perfilProps.id,

      instalacionId: input.instalacionId ?? null,

      desinstalacionId: input.desinstalacionId,

      claveIdempotencia: input.claveIdempotencia,

      tipo: TipoOperacionPppoe.ELIMINAR_SECRET,

      origen: input.actor.origen,

      iniciadoPorId: input.actor.iniciadoPorId,

      /*
       * El flujo de desinstalación ya fue autorizado.
       * No se solicita una segunda autenticación aquí.
       */
      requiereReautenticacion: false,

      motivo:
        input.motivo ??
        'Eliminación definitiva del secret PPPoE durante la desinstalación.',

      usuarioPppoeSnapshot: cuenta.usuario,

      codigoPerfilSnapshot: perfilProps.codigoPerfil,

      routerHostSnapshot: router.host,

      routerPuertoSnapshot: router.sshPort,
    });

    if (aggregate.creada) {
      await this.operacionAuditoria.registrarCreada({
        operacion: aggregate.operacion,

        actor: {
          operadorId: input.actor.iniciadoPorId,

          operadorNombre: input.actor.operadorNombre ?? null,

          ipOrigen: input.actor.ipOrigen ?? null,

          userAgent: input.actor.userAgent ?? null,
        },
      });
    }

    return this.resolveOperation({
      empresaId: input.empresaId,

      operacion: aggregate.operacion,

      estadoCuenta: cuenta.estado,
    });
  }

  /**
   * Ejecuta una operación pendiente o devuelve el estado
   * de una operación existente sin repetir SSH.
   */
  private async resolveOperation(params: {
    empresaId: number;

    operacion: PppoeOperacionEntity;

    estadoCuenta: EstadoCuentaPppoe;
  }): Promise<EjecutarOperacionPppoeResult> {
    const operacionId = this.requireOperationId(params.operacion);

    if (params.operacion.esTerminal()) {
      return this.buildExistingResult({
        operacion: params.operacion,

        estadoCuenta: params.estadoCuenta,
      });
    }

    if (params.operacion.estaEjecutando()) {
      return this.buildExistingResult({
        operacion: params.operacion,

        estadoCuenta: params.estadoCuenta,
      });
    }

    if (params.operacion.estaAutorizada()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} está AUTORIZADA, pero este flujo de desinstalación no utiliza reautenticación adicional.`,
      );
    }

    if (!params.operacion.estaPendiente()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} no puede ejecutarse desde el estado ${params.operacion.estado}.`,
      );
    }

    this.assertAccountCanBeDeleted(params.estadoCuenta);

    return this.ejecutarOperacion.execute({
      empresaId: params.empresaId,

      operacionId,
    });
  }

  /**
   * Estados válidos antes de preparar la desinstalación.
   */
  private assertAccountCanBeDeleted(estado: EstadoCuentaPppoe): void {
    const estadosPermitidos: EstadoCuentaPppoe[] = [
      EstadoCuentaPppoe.PENDIENTE_ACTIVACION,

      EstadoCuentaPppoe.EN_INSTALACION,

      EstadoCuentaPppoe.EN_ACTIVACION,

      EstadoCuentaPppoe.ACTIVA,

      EstadoCuentaPppoe.SUSPENDIDA,

      EstadoCuentaPppoe.ERROR,

      EstadoCuentaPppoe.EN_DESINSTALACION,
    ];

    if (estadosPermitidos.includes(estado)) {
      return;
    }

    if (estado === EstadoCuentaPppoe.ELIMINADA) {
      throw new ConflictException('La cuenta PPPoE ya se encuentra eliminada.');
    }

    throw new ConflictException(
      `No puede eliminarse el secret PPPoE desde el estado ${estado}.`,
    );
  }

  /**
   * Evita utilizar una clave idempotente
   * para una intención diferente.
   */
  private assertCompatibleExistingOperation(params: {
    input: EliminarSecretPppoeInput;

    operacion: PppoeOperacionEntity;

    routerId: number;
  }): void {
    const sameAccount =
      params.operacion.cuentaPppoeId === params.input.cuentaPppoeId;

    const sameRouter = params.operacion.mikrotikRouterId === params.routerId;

    const sameType =
      params.operacion.tipo === TipoOperacionPppoe.ELIMINAR_SECRET;

    const sameInstallation =
      params.operacion.instalacionId === (params.input.instalacionId ?? null);

    const sameUninstallation =
      params.operacion.desinstalacionId === params.input.desinstalacionId;

    if (
      sameAccount &&
      sameRouter &&
      sameType &&
      sameInstallation &&
      sameUninstallation
    ) {
      return;
    }

    throw new ConflictException(
      'La clave de idempotencia ya pertenece a una operación PPPoE diferente.',
    );
  }

  /**
   * Devuelve una operación existente sin repetir SSH.
   */
  private buildExistingResult(params: {
    operacion: PppoeOperacionEntity;

    estadoCuenta: EstadoCuentaPppoe;
  }): EjecutarOperacionPppoeResult {
    const primitives = params.operacion.toPrimitives();

    return {
      operacionId: this.requireOperationId(params.operacion),

      cuentaPppoeId: params.operacion.cuentaPppoeId,

      tipo: params.operacion.tipo,

      estadoOperacion: params.operacion.estado,

      estadoCuenta: params.estadoCuenta,

      numeroIntento: params.operacion.numeroIntento,

      reintentable: params.operacion.puedeReintentarse(),

      resultado: primitives.resultado,

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,
    };
  }

  private requireOperationId(operacion: PppoeOperacionEntity): number {
    if (operacion.id === null) {
      throw new ConflictException(
        'La operación PPPoE no contiene un identificador persistido.',
      );
    }

    return operacion.id;
  }

  private validateInput(input: EliminarSecretPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertPositiveInteger(input.desinstalacionId, 'desinstalacionId');

    this.assertOptionalPositiveInteger(input.instalacionId, 'instalacionId');

    this.assertRequiredString(input.claveIdempotencia, 'claveIdempotencia');

    if (!input.actor) {
      throw new BadRequestException('actor es obligatorio.');
    }

    if (input.actor.iniciadoPorId !== null) {
      this.assertPositiveInteger(
        input.actor.iniciadoPorId,
        'actor.iniciadoPorId',
      );
    }

    if (
      input.actor.origen === OrigenOperacionPppoe.OPERADOR &&
      input.actor.iniciadoPorId === null
    ) {
      throw new BadRequestException(
        'actor.iniciadoPorId es obligatorio cuando el origen es OPERADOR.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private assertOptionalPositiveInteger(
    value: number | null | undefined,
    field: string,
  ): void {
    if (value === null || value === undefined) {
      return;
    }

    this.assertPositiveInteger(value, field);
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
  }
}
