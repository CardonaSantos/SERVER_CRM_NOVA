import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from 'src/modules/pppoe-perfil-homologacion/infra/tokens/ppoe-perfil-homologacion.token';

import { PerfilHomologacionRepositoryPort } from 'src/modules/pppoe-perfil-homologacion/domain/ports/ppoe-perfil-homologacion.port';

import {
  CrearSecretPppoeInput,
  EjecutarOperacionPppoeResult,
} from '../../domain/props/pppoe-provisionamiento.props';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';
import { CrearPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/crear-pppoe-operacion.use-case.ts';
import { MIKROTIK_ROUTER_REPOSITORY } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import { MikrotikRouterRepositoryPort } from 'src/mikro-tik/domain/ports/mikrotik-router-repository.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../../domain/ports/pppoe-operacion-auditoria.port';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

/**
 * Crea y ejecuta una operación CREAR_SECRET.
 *
 * Responsabilidades:
 *
 * - recuperar la cuenta;
 * - recuperar la homologación vinculada;
 * - recuperar el router;
 * - construir snapshots no sensibles;
 * - crear la operación idempotente;
 * - ejecutar la operación cuando todavía no ha comenzado;
 * - devolver operaciones terminales ya existentes sin repetir SSH.
 */
@Injectable()
export class CrearYEjecutarOperacionPppoeUseCase {
  constructor(
    private readonly crearOperacion: CrearPppoeOperacionUseCase,

    private readonly ejecutarOperacion: EjecutarPppoeOperacionUseCase,

    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,

    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly routerRepository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(
    input: CrearSecretPppoeInput,
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
        'No puede crearse un secret para una cuenta PPPoE eliminada.',
      );
    }

    /*
     * ========================================================
     * 2. HOMOLOGACIÓN ASIGNADA A LA CUENTA
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

    if (router.empresaId !== input.empresaId) {
      throw new ConflictException(
        'El router MikroTik no pertenece a la empresa indicada.',
      );
    }

    if (router.id === null) {
      throw new ConflictException(
        'El router MikroTik no contiene un identificador persistido.',
      );
    }

    /*
     * ========================================================
     * 4. CREAR OPERACIÓN IDEMPOTENTE
     * ========================================================
     */

    const aggregate = await this.crearOperacion.execute({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      mikrotikRouterId: router.id,

      perfilHomologacionId: perfilProps.id,

      instalacionId: input.instalacionId,

      desinstalacionId: null,

      claveIdempotencia: input.claveIdempotencia,

      tipo: TipoOperacionPppoe.CREAR_SECRET,

      origen: input.actor.origen,

      iniciadoPorId: input.actor.iniciadoPorId,

      /*
       * El inicio de instalación ya representa
       * una acción autorizada del flujo.
       *
       * No se solicita una segunda contraseña.
       */
      requiereReautenticacion: false,

      motivo:
        input.motivo ??
        'Creación automática del secret PPPoE al iniciar la instalación.',

      usuarioPppoeSnapshot: cuenta.usuario,

      codigoPerfilSnapshot: perfilProps.codigoPerfil,

      routerHostSnapshot: router.host,

      routerPuertoSnapshot: router.sshPort,
    });

    const operacion = aggregate.operacion;

    const operacionId = this.requireOperationId(operacion);

    /*
     * No se duplica la auditoría cuando la misma clave
     * idempotente devuelve una operación existente.
     */
    if (aggregate.creada) {
      await this.operacionAuditoria.registrarCreada({
        operacion,

        actor: {
          operadorId: input.actor.iniciadoPorId,

          operadorNombre: input.actor.operadorNombre ?? null,

          ipOrigen: input.actor.ipOrigen ?? null,

          userAgent: input.actor.userAgent ?? null,
        },
      });
    }

    /*
     * ========================================================
     * 5. IDEMPOTENCIA DE EJECUCIÓN
     * ========================================================
     */

    if (operacion.esTerminal()) {
      return this.buildExistingResult({
        operacion,
        estadoCuenta: cuenta.estado,
      });
    }

    if (operacion.estaEjecutando()) {
      /*
       * La misma clave pudo llegar nuevamente mientras
       * el primer proceso todavía ejecuta SSH.
       *
       * No repetimos comandos ni intentamos reclamar
       * nuevamente la operación.
       */
      return this.buildExistingResult({
        operacion,
        estadoCuenta: cuenta.estado,
      });
    }

    if (operacion.estaAutorizada()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} está AUTORIZADA, pero este flujo automático no utiliza reautenticación.`,
      );
    }

    if (!operacion.estaPendiente()) {
      throw new ConflictException(
        `La operación PPPoE ${operacionId} no puede ejecutarse desde el estado ${operacion.estado}.`,
      );
    }

    /*
     * ========================================================
     * 6. RECLAMAR Y EJECUTAR
     * ========================================================
     */

    return this.ejecutarOperacion.execute({
      empresaId: input.empresaId,

      operacionId,
    });
  }

  /**
   * Construye una respuesta para una operación existente
   * que no debe volver a ejecutarse.
   */
  private buildExistingResult(params: {
    operacion: PppoeOperacionEntity;

    estadoCuenta: EjecutarOperacionPppoeResult['estadoCuenta'];
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

  private validateInput(input: CrearSecretPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertPositiveInteger(input.instalacionId, 'instalacionId');

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

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
    }
  }
}
