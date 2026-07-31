import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

import { IniciarInstalacionClienteDto } from '../dto/iniciar-instalacion.dto';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { EjecutarOperacionPppoeResult } from 'src/modules/pppoe-automatizacion/domain/props/pppoe-provisionamiento.props';

import { ResolverPppoeInstalacionService } from '../services/resolver-pppoe-instalacion.service';
import {
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-provisionamiento.port';
import { AuthService } from 'src/auth/auth.service';

/**
 * Usuario y contexto que originan el inicio
 * de la instalación.
 */
export type IniciarInstalacionActor = {
  operadorId: number;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

export type IniciarInstalacionClienteCommand = IniciarInstalacionClienteDto &
  IniciarInstalacionActor & {
    id: number;
  };

/**
 * 1. valida que exista una prealta;
 * 2. cambia la instalación a EN_PROCESO;
 * 3. crea o confirma el secret en MikroTik;
 * 4. opcionalmente lo habilita cuando
 *    activarServicio=true.
 *
 * La instalación permanece EN_PROCESO hasta
 * completar el trabajo físico.
 *
 * La operación SSH no participa en una transacción
 * de base de datos.
 */
@Injectable()
export class IniciarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,

    private readonly resolverPppoe: ResolverPppoeInstalacionService,
    private readonly authService: AuthService,
    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly pppoeProvisionamiento: PppoeProvisionamientoPort,
  ) {}

  async execute(command: IniciarInstalacionClienteCommand) {
    this.validateCommand(command);

    // Validaciones de estado y relaciones existentes.

    await this.authService.reautenticarUsuarioPorId(
      command.operadorId,
      command.contrasenaActual,
    );

    const instalacion = await this.clienteInstalacion.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.id}.`,
      );
    }

    this.assertCanStartOrResume(instalacion.estado);

    /*
     * Resolvemos la cuenta antes de cambiar el estado.
     *
     * Si una instalación GPON/PPPoE no tiene prealta,
     * permanece PROGRAMADA o REPROGRAMADA.
     */
    const contextoPppoe = await this.resolverPppoe.resolve(instalacion);

    const fechaInicio = this.parseFechaInicio(command.fechaInicio);

    let instalacionPersistida = instalacion;

    /*
     * La primera solicitud realiza la transición.
     *
     * Una repetición después de haber guardado
     * EN_PROCESO no modifica nuevamente la entidad.
     */
    if (
      instalacion.estado === EstadoInstalacionCliente.PROGRAMADA ||
      instalacion.estado === EstadoInstalacionCliente.REPROGRAMADA
    ) {
      instalacion.iniciar({
        fechaInicio,
      });

      instalacionPersistida = await this.clienteInstalacion.save(instalacion);
    }

    /*
     * Los accesos que no son GPON/PPPoE y los accesos
     * existentes MODIFICADOS no requieren este flujo.
     */
    if (!contextoPppoe.aplica) {
      return instalacionPersistida;
    }

    const cuentaPppoeId = contextoPppoe.cuenta.id;

    if (cuentaPppoeId === null) {
      throw new ConflictException(
        'La cuenta PPPoE no contiene un identificador persistido.',
      );
    }

    const resultadoPppoe = await this.pppoeProvisionamiento.crearSecret({
      empresaId: instalacionPersistida.empresaId,

      cuentaPppoeId,

      instalacionId: command.id,

      /*
       * La clave permanece estable.
       *
       * Una repetición de la solicitud recuperará
       * la misma operación y no repetirá SSH.
       */
      claveIdempotencia: this.buildIdempotencyKey({
        instalacionId: command.id,

        cuentaPppoeId,
      }),

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: command.operadorId,

        operadorNombre: command.operadorNombre ?? null,

        ipOrigen: command.ipOrigen ?? null,

        userAgent: command.userAgent ?? null,
      },

      motivo: `Creación del secret PPPoE al iniciar la instalación ${command.id}.`,
    });

    this.assertSuccessfulProvisioning(resultadoPppoe);
    this.assertSuccessfulProvisioning(resultadoPppoe);

    /*
     * Por defecto conservamos el flujo actual:
     * el secret queda creado y deshabilitado.
     */
    if (command.activarServicio !== true) {
      return instalacionPersistida;
    }

    /*
     * Cuando activarServicio=true, habilitamos el
     * secret inmediatamente dentro de esta misma
     * solicitud de inicio.
     */
    const resultadoActivacion = await this.pppoeProvisionamiento.activarSecret({
      empresaId: instalacionPersistida.empresaId,

      cuentaPppoeId,

      instalacionId: command.id,

      /*
       * Debe coincidir con la clave utilizada por
       * CompletarClienteInstalacionUseCase.
       *
       * Así, al completar posteriormente, no se
       * repetirá realmente la operación SSH.
       */
      claveIdempotencia: this.buildActivationIdempotencyKey({
        instalacionId: command.id,

        cuentaPppoeId,
      }),

      actor: {
        origen: OrigenOperacionPppoe.OPERADOR,

        iniciadoPorId: command.operadorId,

        operadorNombre: command.operadorNombre ?? null,

        ipOrigen: command.ipOrigen ?? null,

        userAgent: command.userAgent ?? null,
      },

      motivo: `Activación inmediata del secret PPPoE al iniciar la instalación ${command.id}.`,
    });

    this.assertSuccessfulActivation(resultadoActivacion);

    return instalacionPersistida;
    return instalacionPersistida;
  }

  /**
   * Permite reanudar idempotentemente una solicitud
   * cuyo estado local ya fue guardado como EN_PROCESO.
   */
  private assertCanStartOrResume(estado: EstadoInstalacionCliente): void {
    const estadosPermitidos: EstadoInstalacionCliente[] = [
      EstadoInstalacionCliente.PROGRAMADA,

      EstadoInstalacionCliente.REPROGRAMADA,

      EstadoInstalacionCliente.EN_PROCESO,
    ];

    if (estadosPermitidos.includes(estado)) {
      return;
    }

    throw new ConflictException(
      `No puede iniciarse la instalación desde el estado ${estado}.`,
    );
  }

  /**
   * El provisionamiento se ejecuta sincrónicamente.
   *
   * EXITOSA confirma que el secret existe y está
   * deshabilitado en MikroTik.
   */
  private assertSuccessfulProvisioning(
    resultado: EjecutarOperacionPppoeResult,
  ): void {
    if (resultado.estadoOperacion === EstadoOperacionPppoe.EXITOSA) {
      return;
    }

    if (resultado.estadoOperacion === EstadoOperacionPppoe.EJECUTANDO) {
      throw new ConflictException(
        `La operación PPPoE ${resultado.operacionId} ya está siendo ejecutada por otra solicitud.`,
      );
    }

    if (
      resultado.estadoOperacion === EstadoOperacionPppoe.FALLIDA ||
      resultado.estadoOperacion === EstadoOperacionPppoe.PARCIAL
    ) {
      throw new ConflictException(
        resultado.errorMensaje
          ? `La instalación quedó EN_PROCESO, pero falló el provisionamiento PPPoE: ${resultado.errorMensaje}`
          : `La instalación quedó EN_PROCESO, pero la operación PPPoE ${resultado.operacionId} terminó en estado ${resultado.estadoOperacion}.`,
      );
    }

    throw new ConflictException(
      `La operación PPPoE ${resultado.operacionId} quedó en estado ${resultado.estadoOperacion} y no confirmó la creación del secret.`,
    );
  }

  private buildIdempotencyKey(params: {
    instalacionId: number;

    cuentaPppoeId: number;
  }): string {
    return [
      'cliente-instalacion',
      params.instalacionId,
      'cuenta-pppoe',
      params.cuentaPppoeId,
      'crear-secret',
    ].join(':');
  }

  private validateCommand(command: IniciarInstalacionClienteCommand): void {
    this.assertPositiveInteger(command.id, 'id');

    this.assertPositiveInteger(command.operadorId, 'operadorId');
  }

  private parseFechaInicio(
    value: string | Date | null | undefined,
  ): Date | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }

    const fecha = new Date(value);

    if (Number.isNaN(fecha.getTime())) {
      throw new BadRequestException(
        'fechaInicio debe contener una fecha válida.',
      );
    }

    return fecha;
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private buildActivationIdempotencyKey(params: {
    instalacionId: number;

    cuentaPppoeId: number;
  }): string {
    return [
      'cliente-instalacion',

      params.instalacionId,

      'cuenta-pppoe',

      params.cuentaPppoeId,

      'activar-secret',
    ].join(':');
  }

  private assertSuccessfulActivation(
    resultado: EjecutarOperacionPppoeResult,
  ): void {
    if (resultado.estadoOperacion === EstadoOperacionPppoe.EXITOSA) {
      return;
    }

    if (resultado.estadoOperacion === EstadoOperacionPppoe.EJECUTANDO) {
      throw new ConflictException(
        `La operación de activación PPPoE ${resultado.operacionId} ya está siendo ejecutada por otra solicitud.`,
      );
    }

    if (
      resultado.estadoOperacion === EstadoOperacionPppoe.FALLIDA ||
      resultado.estadoOperacion === EstadoOperacionPppoe.PARCIAL
    ) {
      throw new ConflictException(
        resultado.errorMensaje
          ? `El secret fue creado, pero falló su activación: ${resultado.errorMensaje}`
          : `El secret fue creado, pero la operación de activación ${resultado.operacionId} terminó en estado ${resultado.estadoOperacion}.`,
      );
    }

    throw new ConflictException(
      `La operación de activación PPPoE ${resultado.operacionId} quedó en estado ${resultado.estadoOperacion} y no confirmó que el secret estuviera habilitado.`,
    );
  }
}
