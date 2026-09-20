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

import { CrearPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/crear-pppoe-operacion.use-case.ts';

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
  ActorOperacionPppoeInput,
  DarDeBajaServicioPppoeInput,
  EjecutarOperacionPppoeResult,
  EliminarSecretPppoeInput,
} from '../../domain/props/pppoe-provisionamiento.props';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';

/**
 * Contexto funcional desde el que se solicita
 * ELIMINAR_SECRET.
 *
 * La operación técnica es la misma.
 * Lo que cambia es la intención de negocio que la origina.
 */
export enum ModoEliminacionPppoe {
  DESINSTALACION = 'DESINSTALACION',

  BAJA_MANUAL = 'BAJA_MANUAL',
}

type EjecutarEliminacionPppoeInternaInput = {
  modo: ModoEliminacionPppoe;

  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  motivo?: string | null;

  actor: ActorOperacionPppoeInput;

  instalacionId: number | null;

  desinstalacionId: number | null;
};

/**
 * Crea y ejecuta una operación técnica ELIMINAR_SECRET.
 *
 * Puede ser utilizada desde dos contextos funcionales:
 *
 * 1. DESINSTALACION
 *
 *    La eliminación pertenece a una
 *    ClienteDesinstalacion previamente autorizada.
 *
 * 2. BAJA_MANUAL
 *
 *    La eliminación fue solicitada directamente
 *    por un operador administrativo sin crear
 *    ClienteInstalacion ni ClienteDesinstalacion.
 *
 * En ambos casos:
 *
 * - la reautenticación ocurre antes de entrar aquí;
 * - este caso de uso no conoce contraseñas del operador;
 * - se reutiliza exactamente la misma operación
 *   técnica ELIMINAR_SECRET;
 * - se mantiene la misma infraestructura de
 *   idempotencia, pasos, auditoría y recuperación.
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

  /**
   * Conserva el contrato existente utilizado por
   * ClienteDesinstalacion.
   *
   * No cambia ningún caller actual.
   */
  execute(
    input: EliminarSecretPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    return this.executeInternal({
      modo: ModoEliminacionPppoe.DESINSTALACION,

      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      claveIdempotencia: input.claveIdempotencia,

      motivo: input.motivo ?? null,

      actor: input.actor,

      instalacionId: input.instalacionId ?? null,

      desinstalacionId: input.desinstalacionId,
    });
  }

  /**
   * Ejecuta la misma baja técnica sin crear
   * un flujo ClienteDesinstalacion.
   *
   * Esta función todavía no debe exponerse
   * directamente desde HTTP.
   *
   * La fachada administrativa será responsable
   * de reautenticar al operador antes de llamarla.
   */
  executeBajaManual(
    input: DarDeBajaServicioPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    return this.executeInternal({
      modo: ModoEliminacionPppoe.BAJA_MANUAL,

      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      claveIdempotencia: input.claveIdempotencia,

      motivo: input.motivo,

      actor: input.actor,

      instalacionId: null,

      desinstalacionId: null,
    });
  }

  private async executeInternal(
    input: EjecutarEliminacionPppoeInternaInput,
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

        modo: input.modo,
      });
    }

    /*
     * Una nueva intención no puede iniciarse cuando
     * el estado de la cuenta no es compatible con
     * el contexto funcional solicitado.
     *
     * Una repetición idempotente de una operación
     * anterior fue resuelta antes de esta validación.
     */
    this.assertAccountCanBeDeleted({
      estado: cuenta.estado,

      modo: input.modo,
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

      instalacionId: input.instalacionId,

      desinstalacionId: input.desinstalacionId,

      claveIdempotencia: input.claveIdempotencia,

      tipo: TipoOperacionPppoe.ELIMINAR_SECRET,

      origen: input.actor.origen,

      iniciadoPorId: input.actor.iniciadoPorId,

      /*
       * Tanto DESINSTALACION como BAJA_MANUAL
       * llegan aquí después de una autorización
       * o reautenticación realizada por su fachada
       * administrativa correspondiente.
       *
       * La contraseña jamás entra al motor PPPoE.
       */
      requiereReautenticacion: false,

      motivo: this.resolveOperationReason(input),

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

      modo: input.modo,
    });
  }

  /**
   * Ejecuta una operación pendiente o devuelve
   * el estado persistido sin repetir SSH.
   */
  private async resolveOperation(params: {
    empresaId: number;

    operacion: PppoeOperacionEntity;

    estadoCuenta: EstadoCuentaPppoe;

    modo: ModoEliminacionPppoe;
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

    /*
     * Ninguno de estos dos contextos genera una
     * operación PPPoE pendiente de una segunda
     * autorización.
     *
     * DESINSTALACION:
     *   fue autorizada por su flujo administrativo.
     *
     * BAJA_MANUAL:
     *   el operador fue reautenticado antes de llegar aquí.
     */
    if (params.operacion.estaAutorizada()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} está AUTORIZADA, pero este flujo ejecuta ELIMINAR_SECRET después de una autorización administrativa previa.`,
      );
    }

    if (!params.operacion.estaPendiente()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} no puede ejecutarse desde el estado ${params.operacion.estado}.`,
      );
    }

    this.assertAccountCanBeDeleted({
      estado: params.estadoCuenta,

      modo: params.modo,
    });

    return this.ejecutarOperacion.execute({
      empresaId: params.empresaId,

      operacionId,
    });
  }

  /**
   * Estados permitidos para iniciar una nueva
   * eliminación según su contexto de negocio.
   *
   * DESINSTALACION conserva las reglas actuales.
   *
   * BAJA_MANUAL se limita deliberadamente a cuentas
   * cuyo servicio ya se encontraba formalmente
   * ACTIVO o SUSPENDIDO.
   */
  private assertAccountCanBeDeleted(params: {
    estado: EstadoCuentaPppoe;

    modo: ModoEliminacionPppoe;
  }): void {
    if (params.estado === EstadoCuentaPppoe.ELIMINADA) {
      throw new ConflictException('La cuenta PPPoE ya se encuentra eliminada.');
    }

    if (params.modo === ModoEliminacionPppoe.BAJA_MANUAL) {
      const estadosPermitidosBajaManual: EstadoCuentaPppoe[] = [
        EstadoCuentaPppoe.ACTIVA,

        EstadoCuentaPppoe.SUSPENDIDA,
      ];

      if (estadosPermitidosBajaManual.includes(params.estado)) {
        return;
      }

      throw new ConflictException(
        `No puede darse de baja manualmente una cuenta PPPoE desde el estado ${params.estado}.`,
      );
    }

    const estadosPermitidosDesinstalacion: EstadoCuentaPppoe[] = [
      EstadoCuentaPppoe.PENDIENTE_ACTIVACION,

      EstadoCuentaPppoe.EN_INSTALACION,

      EstadoCuentaPppoe.EN_ACTIVACION,

      EstadoCuentaPppoe.ACTIVA,

      EstadoCuentaPppoe.SUSPENDIDA,

      EstadoCuentaPppoe.ERROR,

      EstadoCuentaPppoe.EN_DESINSTALACION,
    ];

    if (estadosPermitidosDesinstalacion.includes(params.estado)) {
      return;
    }

    throw new ConflictException(
      `No puede eliminarse el secret PPPoE desde el estado ${params.estado}.`,
    );
  }

  /**
   * Evita reutilizar una clave idempotente
   * para una intención diferente.
   */
  private assertCompatibleExistingOperation(params: {
    input: EjecutarEliminacionPppoeInternaInput;

    operacion: PppoeOperacionEntity;

    routerId: number;
  }): void {
    const sameAccount =
      params.operacion.cuentaPppoeId === params.input.cuentaPppoeId;

    const sameRouter = params.operacion.mikrotikRouterId === params.routerId;

    const sameType =
      params.operacion.tipo === TipoOperacionPppoe.ELIMINAR_SECRET;

    const sameInstallation =
      params.operacion.instalacionId === params.input.instalacionId;

    const sameUninstallation =
      params.operacion.desinstalacionId === params.input.desinstalacionId;

    const sameMode =
      this.resolveOperationMode(params.operacion) === params.input.modo;

    if (
      sameAccount &&
      sameRouter &&
      sameType &&
      sameInstallation &&
      sameUninstallation &&
      sameMode
    ) {
      return;
    }

    throw new ConflictException(
      'La clave de idempotencia ya pertenece a una operación PPPoE diferente.',
    );
  }

  /**
   * La forma persistida permite distinguir los
   * dos contextos sin agregar una columna nueva:
   *
   * DESINSTALACION:
   *   desinstalacionId != null
   *
   * BAJA_MANUAL:
   *   desinstalacionId == null
   *   instalacionId == null
   */
  private resolveOperationMode(
    operacion: PppoeOperacionEntity,
  ): ModoEliminacionPppoe {
    if (operacion.tipo !== TipoOperacionPppoe.ELIMINAR_SECRET) {
      throw new ConflictException(
        `La operación ${operacion.id ?? 'sin-id'} no es ELIMINAR_SECRET.`,
      );
    }

    if (operacion.desinstalacionId !== null) {
      return ModoEliminacionPppoe.DESINSTALACION;
    }

    if (operacion.instalacionId === null) {
      return ModoEliminacionPppoe.BAJA_MANUAL;
    }

    throw new ConflictException(
      'La operación ELIMINAR_SECRET no contiene un contexto funcional válido.',
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

  /**
   * Valida tanto datos comunes como las invariantes
   * particulares del contexto funcional.
   */
  private validateInput(input: EjecutarEliminacionPppoeInternaInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

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

    switch (input.modo) {
      case ModoEliminacionPppoe.DESINSTALACION:
        this.validateUninstallationInput(input);
        return;

      case ModoEliminacionPppoe.BAJA_MANUAL:
        this.validateManualTerminationInput(input);
        return;

      default:
        throw new BadRequestException(
          `Modo de eliminación PPPoE no soportado: ${String(input.modo)}.`,
        );
    }
  }

  private validateUninstallationInput(
    input: EjecutarEliminacionPppoeInternaInput,
  ): void {
    if (input.desinstalacionId === null) {
      throw new BadRequestException(
        'desinstalacionId es obligatorio para una eliminación originada por desinstalación.',
      );
    }

    this.assertPositiveInteger(input.desinstalacionId, 'desinstalacionId');

    this.assertOptionalPositiveInteger(input.instalacionId, 'instalacionId');
  }

  private validateManualTerminationInput(
    input: EjecutarEliminacionPppoeInternaInput,
  ): void {
    if (input.desinstalacionId !== null) {
      throw new BadRequestException(
        'Una baja manual PPPoE no puede estar vinculada a una desinstalación.',
      );
    }

    if (input.instalacionId !== null) {
      throw new BadRequestException(
        'Una baja manual PPPoE no puede estar vinculada a una instalación.',
      );
    }

    if (input.actor.origen !== OrigenOperacionPppoe.OPERADOR) {
      throw new BadRequestException(
        'Una baja manual PPPoE debe ser iniciada por un operador.',
      );
    }

    if (input.actor.iniciadoPorId === null) {
      throw new BadRequestException(
        'actor.iniciadoPorId es obligatorio para una baja manual PPPoE.',
      );
    }

    this.assertRequiredString(input.motivo, 'motivo');
  }

  private resolveOperationReason(
    input: EjecutarEliminacionPppoeInternaInput,
  ): string {
    const motivo = input.motivo?.trim();

    if (motivo) {
      return motivo;
    }

    if (input.modo === ModoEliminacionPppoe.DESINSTALACION) {
      return 'Eliminación definitiva del secret PPPoE durante la desinstalación.';
    }

    /*
     * En BAJA_MANUAL validateManualTerminationInput()
     * exige motivo, por lo que este fallback es solamente
     * defensivo.
     */
    return 'Baja manual definitiva de la cuenta PPPoE.';
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

  private assertRequiredString(
    value: string | null | undefined,
    field: string,
  ): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
  }
}
