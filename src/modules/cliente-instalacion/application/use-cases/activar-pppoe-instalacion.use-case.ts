import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { AuthService } from 'src/auth/auth.service';

import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

import { ResolverPppoeInstalacionService } from '../services/resolver-pppoe-instalacion.service';

import {
  PPPOE_PROVISIONAMIENTO,
  PppoeProvisionamientoPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-provisionamiento.port';

import { EjecutarOperacionPppoeResult } from 'src/modules/pppoe-automatizacion/domain/props/pppoe-provisionamiento.props';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { ActivarPppoeInstalacionResult } from '../../results/activar-pppoe-instalacion.result';

import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';

import { ObtenerDetalleCuentaPppoeUseCase } from 'src/modules/pppoe-cliente-cuenta/application/use-cases/obtener-detalle-cuenta-pppoe.use-case';

import { FlujoActivacionCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/flujo-activacion-cuenta-pppoe.enum';

import { ClientePppoeCuentaDetalleActivacionAccion } from 'src/modules/pppoe-cliente-cuenta/domain/read-models/cliente-pppoe-cuenta-detalle.read-model';

export type ActivarPppoeInstalacionCommand = {
  instalacionId: number;

  /**
   * Contexto obtenido exclusivamente del JWT.
   */
  empresaId: number;

  operadorId: number;

  operadorNombre?: string | null;

  actorRol: string;

  ipOrigen?: string | null;

  userAgent?: string | null;

  /**
   * Único dato sensible recibido desde el body.
   *
   * Sólo se utiliza para reautenticación administrativa.
   */
  contrasenaActual: string;
};

/**
 * Realiza la primera activación PPPoE de una cuenta
 * perteneciente a ClienteInstalacion.
 *
 * Responsabilidades específicas:
 *
 * - comprobar permisos de oficina;
 * - reautenticar al operador;
 * - resolver instalación, acceso y cuenta;
 * - validar que la cuenta declara flujo INSTALACION;
 * - iniciar formalmente la instalación cuando corresponda;
 * - crear/confirmar el secret;
 * - activar/confirmar habilitado el secret;
 * - registrar fechaActivacionServicio.
 *
 * No construye comandos RouterOS ni abre SSH directamente.
 */
@Injectable()
export class ActivarPppoeInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacionRepository: ClienteInstalacionRepositoryPort,

    private readonly resolverPppoe: ResolverPppoeInstalacionService,

    private readonly obtenerDetalleCuenta: ObtenerDetalleCuentaPppoeUseCase,

    private readonly authService: AuthService,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly pppoeProvisionamiento: PppoeProvisionamientoPort,
  ) {}

  async execute(
    command: ActivarPppoeInstalacionCommand,
  ): Promise<ActivarPppoeInstalacionResult> {
    this.validateCommand(command);

    this.assertOfficeRole(command.actorRol);

    /**
     * La contraseña termina en AuthService.
     *
     * Nunca entra en:
     *
     * - operaciones PPPoE;
     * - auditorías PPPoE;
     * - metadata;
     * - ejecutores SSH.
     */
    await this.authService.reautenticarUsuarioPorId(
      command.operadorId,
      command.contrasenaActual,
    );

    const instalacion = await this.clienteInstalacionRepository.findById({
      id: command.instalacionId,
    });

    /**
     * No revelamos si un ID existe en otra empresa.
     */
    if (!instalacion || instalacion.empresaId !== command.empresaId) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.instalacionId}.`,
      );
    }

    /**
     * Resolvemos la identidad PPPoE creada durante
     * la prealta de esta instalación.
     */
    const contextoPppoe = await this.resolverPppoe.resolve(instalacion);

    if (!contextoPppoe.aplica) {
      throw new ConflictException(
        'La instalación no contiene un acceso nuevo GPON/PPPoE que pueda activarse.',
      );
    }

    const cuentaPppoeId = contextoPppoe.cuenta.id;

    if (cuentaPppoeId === null) {
      throw new ConflictException(
        'La cuenta PPPoE no contiene un identificador persistido.',
      );
    }

    /**
     * La política del detalle debe confirmar que esta cuenta
     * pertenece precisamente al flujo de esta instalación.
     *
     * Esto evita que los diferentes entry-points de activación
     * tengan reglas independientes.
     */
    const detalleCuenta = await this.obtenerDetalleCuenta.execute({
      empresaId: command.empresaId,

      cuentaPppoeId,
    });

    this.assertInstallationActivationAllowed({
      accion: detalleCuenta.acciones.activar,

      instalacionId: command.instalacionId,
    });

    /**
     * La activación administrativa inicia formalmente
     * el trabajo cuando todavía se encuentra programado.
     *
     * Se persiste antes de SSH.
     *
     * Si MikroTik falla, la instalación permanecerá
     * EN_PROCESO y la operación podrá recuperarse/reintentarse.
     */
    let instalacionPersistida =
      await this.ensureInstallationInProgress(instalacion);

    const actor = {
      origen: OrigenOperacionPppoe.OPERADOR,

      iniciadoPorId: command.operadorId,

      operadorNombre: command.operadorNombre ?? null,

      ipOrigen: command.ipOrigen ?? null,

      userAgent: command.userAgent ?? null,
    };

    let resultadoCreacion: EjecutarOperacionPppoeResult | null = null;

    /**
     * Si el secret ya fue confirmado por una ejecución
     * o reintento anterior, no repetimos CREAR_SECRET.
     */
    if (!contextoPppoe.cuenta.tieneSecretCreado) {
      resultadoCreacion = await this.pppoeProvisionamiento.crearSecret({
        empresaId: instalacionPersistida.empresaId,

        cuentaPppoeId,

        instalacionId: command.instalacionId,

        claveIdempotencia: this.buildCreationIdempotencyKey({
          instalacionId: command.instalacionId,

          cuentaPppoeId,
        }),

        actor,

        motivo:
          `Creación o confirmación del secret PPPoE ` +
          `autorizada desde oficina para la instalación ` +
          `${command.instalacionId}.`,
      });

      this.assertSuccessfulOperation(resultadoCreacion, 'creación del secret');
    }

    /**
     * ACTIVAR_SECRET utiliza una clave independiente de
     * CREAR_SECRET para mantener idempotencia por operación.
     */
    const resultadoActivacion = await this.pppoeProvisionamiento.activarSecret({
      empresaId: instalacionPersistida.empresaId,

      cuentaPppoeId,

      instalacionId: command.instalacionId,

      claveIdempotencia: this.buildActivationIdempotencyKey({
        instalacionId: command.instalacionId,

        cuentaPppoeId,
      }),

      actor,

      motivo:
        `Activación del servicio PPPoE autorizada ` +
        `desde oficina para la instalación ` +
        `${command.instalacionId}.`,
    });

    this.assertSuccessfulOperation(
      resultadoActivacion,
      'activación del secret',
    );

    /**
     * La identidad PPPoE y el acceso ya quedaron activos.
     *
     * Ahora registramos el efecto propio del aggregate
     * ClienteInstalacion.
     */
    const primitives = instalacionPersistida.toPrimitives();

    if (!primitives.fechaActivacionServicio) {
      instalacionPersistida.marcarServicioActivado(new Date());

      instalacionPersistida = await this.clienteInstalacionRepository.save(
        instalacionPersistida,
      );
    }

    const activadoEn =
      instalacionPersistida.toPrimitives().fechaActivacionServicio;

    if (!activadoEn) {
      throw new ConflictException(
        'El servicio fue activado, pero no fue posible confirmar la fecha de activación local.',
      );
    }

    return {
      instalacion: instalacionPersistida,

      accesoInternetId: contextoPppoe.accesoInternetId,

      cuentaPppoeId,

      creacion: resultadoCreacion,

      activacion: resultadoActivacion,

      activadoEn,
    };
  }

  /**
   * Confirma que el detalle de cuenta eligió exactamente
   * el orquestador de instalación actual.
   */
  private assertInstallationActivationAllowed(params: {
    accion: ClientePppoeCuentaDetalleActivacionAccion;

    instalacionId: number;
  }): void {
    const { accion, instalacionId } = params;

    if (accion.flujo !== FlujoActivacionCuentaPppoe.INSTALACION) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece al flujo de instalación.',
      );
    }

    if (accion.instalacionId !== instalacionId) {
      throw new ConflictException(
        accion.instalacionId === null
          ? 'La cuenta PPPoE no posee una instalación operativa vinculada.'
          : `La cuenta PPPoE está vinculada operativamente a la instalación ${accion.instalacionId}, no a la instalación ${instalacionId}.`,
      );
    }

    if (!accion.habilitada) {
      throw new ConflictException(
        accion.motivo ?? 'La cuenta PPPoE no puede activarse actualmente.',
      );
    }
  }

  private assertOfficeRole(actorRol: string): void {
    const rolNormalizado = actorRol.trim().toUpperCase();

    if (
      rolNormalizado === 'OFICINA' ||
      rolNormalizado === 'ADMIN' ||
      rolNormalizado === 'SUPER_ADMIN'
    ) {
      return;
    }

    throw new ForbiddenException(
      'Solo el personal de oficina puede activar una cuenta PPPoE.',
    );
  }

  private assertSuccessfulOperation(
    resultado: EjecutarOperacionPppoeResult,
    nombreOperacion: string,
  ): void {
    if (resultado.estadoOperacion === EstadoOperacionPppoe.EXITOSA) {
      return;
    }

    if (resultado.estadoOperacion === EstadoOperacionPppoe.EJECUTANDO) {
      throw new ConflictException(
        `La ${nombreOperacion} ya está siendo ejecutada por otra solicitud. Operación ${resultado.operacionId}.`,
      );
    }

    if (
      resultado.estadoOperacion === EstadoOperacionPppoe.FALLIDA ||
      resultado.estadoOperacion === EstadoOperacionPppoe.PARCIAL
    ) {
      throw new ConflictException(
        resultado.errorMensaje
          ? `Falló la ${nombreOperacion}: ${resultado.errorMensaje}`
          : `La ${nombreOperacion} terminó en estado ${resultado.estadoOperacion}. Operación ${resultado.operacionId}.`,
      );
    }

    throw new ConflictException(
      `La ${nombreOperacion} quedó en estado ${resultado.estadoOperacion} y no confirmó el resultado esperado.`,
    );
  }

  private buildCreationIdempotencyKey(params: {
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

  private validateCommand(command: ActivarPppoeInstalacionCommand): void {
    this.assertPositiveInteger(command.instalacionId, 'instalacionId');

    this.assertPositiveInteger(command.empresaId, 'empresaId');

    this.assertPositiveInteger(command.operadorId, 'operadorId');

    if (
      typeof command.actorRol !== 'string' ||
      command.actorRol.trim().length === 0
    ) {
      throw new ForbiddenException(
        'No fue posible determinar el rol del operador.',
      );
    }

    /**
     * No utilizamos trim() sobre la contraseña.
     *
     * Una contraseña puede contener espacios legítimos.
     */
    if (
      typeof command.contrasenaActual !== 'string' ||
      command.contrasenaActual.length === 0
    ) {
      throw new BadRequestException('contrasenaActual es obligatoria.');
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private async ensureInstallationInProgress(
    instalacion: ClienteInstalacionEntity,
  ): Promise<ClienteInstalacionEntity> {
    switch (instalacion.estado) {
      case EstadoInstalacionCliente.PROGRAMADA:
      case EstadoInstalacionCliente.REPROGRAMADA: {
        instalacion.iniciar({
          fechaInicio: new Date(),
        });

        return this.clienteInstalacionRepository.save(instalacion);
      }

      case EstadoInstalacionCliente.EN_PROCESO:
        /**
         * Repetición idempotente.
         *
         * Conservamos fechaInicio.
         */
        return instalacion;

      case EstadoInstalacionCliente.COMPLETADA:
        /**
         * Compatibilidad con instalaciones históricas
         * terminadas físicamente antes de que oficina
         * confirmara PPPoE.
         */
        return instalacion;

      case EstadoInstalacionCliente.CANCELADA:
      case EstadoInstalacionCliente.FALLIDA:
        throw new ConflictException(
          `No puede activarse PPPoE mientras la instalación se encuentre en estado ${instalacion.estado}.`,
        );

      default:
        throw new ConflictException(
          `El estado ${instalacion.estado} no permite activar PPPoE.`,
        );
    }
  }
}
