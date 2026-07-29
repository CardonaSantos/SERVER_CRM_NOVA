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

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionRepositoryPort,
} from 'src/modules/pppoe-operacion/domain/ports/pppoe-operacion-repository.port';

import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { PerfilHomologacionRepositoryPort } from 'src/modules/pppoe-perfil-homologacion/domain/ports/ppoe-perfil-homologacion.port';

import { EjecutarOperacionPppoeResult } from '../../domain/props/pppoe-provisionamiento.props';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';
import { CrearPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/crear-pppoe-operacion.use-case.ts';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from 'src/modules/pppoe-perfil-homologacion/infra/tokens/ppoe-perfil-homologacion.token';
import { MIKROTIK_ROUTER_REPOSITORY } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import { MikrotikRouterRepositoryPort } from 'src/mikro-tik/domain/ports/mikrotik-router-repository.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../../domain/ports/pppoe-operacion-auditoria.port';

/**
 * Actor que solicita la activación.
 */
export type ActorActivacionPppoeInput = {
  origen: OrigenOperacionPppoe;

  iniciadoPorId: number | null;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

/**
 * Datos necesarios para crear y ejecutar
 * una operación ACTIVAR_SECRET.
 */
export type CrearYEjecutarActivacionPppoeInput = {
  empresaId: number;

  cuentaPppoeId: number;

  instalacionId?: number | null;

  claveIdempotencia: string;

  actor: ActorActivacionPppoeInput;

  motivo?: string | null;
};

/**
 * Crea y ejecuta una operación ACTIVAR_SECRET.
 *
 * El secret debe existir previamente en MikroTik.
 *
 * Estados válidos de la cuenta:
 *
 * - EN_INSTALACION;
 * - SUSPENDIDA;
 * - ERROR con secret creado;
 * - EN_ACTIVACION.
 */
@Injectable()
export class CrearYEjecutarActivacionPppoeUseCase {
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
    input: CrearYEjecutarActivacionPppoeInput,
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

    if (cuenta.empresaId !== input.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece a la empresa indicada.',
      );
    }

    if (cuenta.estaEliminada) {
      throw new ConflictException(
        'No puede activarse una cuenta PPPoE eliminada.',
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

    if (perfilProps.empresaId !== input.empresaId) {
      throw new ConflictException(
        'La homologación PPPoE no pertenece a la empresa indicada.',
      );
    }

    if (perfilProps.id !== cuenta.perfilHomologacionId) {
      throw new ConflictException(
        'La homologación PPPoE no coincide con la asignada a la cuenta.',
      );
    }

    /*
     * ========================================================
     * 3. ROUTER
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

        cuentaTieneSecret: cuenta.tieneSecretCreado,
      });
    }

    /*
     * Antes de crear una nueva operación comprobamos
     * que la cuenta realmente pueda activarse.
     *
     * Esto evita crear operaciones PENDIENTES inválidas.
     */

    this.assertAccountCanBeActivated({
      estado: cuenta.estado,

      tieneSecret: cuenta.tieneSecretCreado,
    });

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

      desinstalacionId: null,

      claveIdempotencia: input.claveIdempotencia,

      tipo: TipoOperacionPppoe.ACTIVAR_SECRET,

      origen: input.actor.origen,

      iniciadoPorId: input.actor.iniciadoPorId,

      requiereReautenticacion: false,

      motivo: input.motivo ?? 'Activación del secret PPPoE en MikroTik.',

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

    /*
     * CrearPppoeOperacionUseCase también protege la
     * idempotencia frente a una carrera concurrente.
     */

    return this.resolveOperation({
      empresaId: input.empresaId,

      operacion: aggregate.operacion,

      estadoCuenta: cuenta.estado,

      cuentaTieneSecret: cuenta.tieneSecretCreado,
    });
  }

  /**
   * Ejecuta una operación PENDIENTE o devuelve
   * el estado de una operación ya procesada.
   */
  private async resolveOperation(params: {
    empresaId: number;

    operacion: PppoeOperacionEntity;

    estadoCuenta: EstadoCuentaPppoe;

    cuentaTieneSecret: boolean;
  }): Promise<EjecutarOperacionPppoeResult> {
    const operacionId = this.requireOperationId(params.operacion);

    /*
     * La misma clave puede repetirse después de que
     * la primera solicitud terminó.
     */
    if (params.operacion.esTerminal()) {
      return this.buildExistingResult({
        operacion: params.operacion,

        estadoCuenta: params.estadoCuenta,
      });
    }

    /*
     * Otra solicitud ya reclamó la operación.
     *
     * No se repite SSH.
     */
    if (params.operacion.estaEjecutando()) {
      return this.buildExistingResult({
        operacion: params.operacion,

        estadoCuenta: params.estadoCuenta,
      });
    }

    if (params.operacion.estaAutorizada()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} está AUTORIZADA, pero ACTIVAR_SECRET no utiliza reautenticación.`,
      );
    }

    if (!params.operacion.estaPendiente()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} no puede ejecutarse desde el estado ${params.operacion.estado}.`,
      );
    }

    this.assertAccountCanBeActivated({
      estado: params.estadoCuenta,

      tieneSecret: params.cuentaTieneSecret,
    });

    return this.ejecutarOperacion.execute({
      empresaId: params.empresaId,

      operacionId,
    });
  }

  /**
   * Estados locales válidos antes de ACTIVAR_SECRET.
   */
  private assertAccountCanBeActivated(params: {
    estado: EstadoCuentaPppoe;

    tieneSecret: boolean;
  }): void {
    if (!params.tieneSecret) {
      throw new ConflictException(
        'La cuenta PPPoE no tiene un secret creado que pueda activarse.',
      );
    }

    const estadosPermitidos: EstadoCuentaPppoe[] = [
      EstadoCuentaPppoe.EN_INSTALACION,

      EstadoCuentaPppoe.SUSPENDIDA,

      EstadoCuentaPppoe.ERROR,

      EstadoCuentaPppoe.EN_ACTIVACION,
    ];

    if (!estadosPermitidos.includes(params.estado)) {
      throw new ConflictException(
        `No puede activarse la cuenta PPPoE desde el estado ${params.estado}.`,
      );
    }
  }

  /**
   * Evita reutilizar una clave para otra intención.
   */
  private assertCompatibleExistingOperation(params: {
    input: CrearYEjecutarActivacionPppoeInput;

    operacion: PppoeOperacionEntity;

    routerId: number;
  }): void {
    const sameAccount =
      params.operacion.cuentaPppoeId === params.input.cuentaPppoeId;

    const sameRouter = params.operacion.mikrotikRouterId === params.routerId;

    const sameType =
      params.operacion.tipo === TipoOperacionPppoe.ACTIVAR_SECRET;

    const sameInstallation =
      params.operacion.instalacionId === (params.input.instalacionId ?? null);

    if (sameAccount && sameRouter && sameType && sameInstallation) {
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

  private validateInput(input: CrearYEjecutarActivacionPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

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
