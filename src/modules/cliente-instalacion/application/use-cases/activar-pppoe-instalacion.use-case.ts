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

export type ActivarPppoeInstalacionCommand = {
  instalacionId: number;

  /**
   * Datos obtenidos exclusivamente del JWT.
   */
  empresaId: number;
  operadorId: number;
  operadorNombre?: string | null;
  actorRol: string;

  ipOrigen?: string | null;
  userAgent?: string | null;

  /**
   * Único valor recibido desde el body.
   */
  contrasenaActual: string;
};

/**
 * Activa la cuenta PPPoE asociada con una instalación.
 *
 * Este caso de uso:
 *
 * 1. valida que el actor sea de OFICINA;
 * 2. reautentica al operador;
 * 3. valida empresa e instalación;
 * 4. resuelve la cuenta generada durante la prealta;
 * 5. crea o confirma el secret en MikroTik;
 * 6. habilita o confirma habilitado el secret;
 * 7. registra fechaActivacionServicio.
 *
 * No cambia el estado general de ClienteInstalacion.
 */
@Injectable()
export class ActivarPppoeInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacionRepository: ClienteInstalacionRepositoryPort,

    private readonly resolverPppoe: ResolverPppoeInstalacionService,

    private readonly authService: AuthService,

    @Inject(PPPOE_PROVISIONAMIENTO)
    private readonly pppoeProvisionamiento: PppoeProvisionamientoPort,
  ) {}

  async execute(
    command: ActivarPppoeInstalacionCommand,
  ): Promise<ActivarPppoeInstalacionResult> {
    this.validateCommand(command);

    this.assertOfficeRole(command.actorRol);

    /*
     * La contraseña no se registra en operaciones,
     * auditorías ni metadata.
     */
    await this.authService.reautenticarUsuarioPorId(
      command.operadorId,
      command.contrasenaActual,
    );

    const instalacion = await this.clienteInstalacionRepository.findById({
      id: command.instalacionId,
    });

    /*
     * No revelamos si el ID pertenece a otra empresa.
     */
    if (!instalacion || instalacion.empresaId !== command.empresaId) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.instalacionId}.`,
      );
    }

    // this.assertInstallationAllowsActivation(instalacion.estado);

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

    /*
     * La activación administrativa inicia formalmente
     * el flujo de instalación.
     *
     * Se persiste antes de ejecutar SSH. Si MikroTik falla,
     * la instalación permanece EN_PROCESO y la operación
     * podrá reintentarse.
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

    /*
     * Primero creamos o confirmamos el secret.
     *
     * La clave es la misma utilizada por el flujo
     * anterior, por lo que una repetición no genera
     * otra operación SSH.
     */
    let resultadoCreacion: EjecutarOperacionPppoeResult | null = null;

    /*
     * Una prealta o un reintento anterior puede haber
     * confirmado correctamente la creación del secret.
     *
     * En ese caso no volvemos a consultar la operación raíz
     * mediante su clave de idempotencia, porque dicha
     * operación pudo haber fallado y haber sido corregida
     * mediante un reintento posterior.
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

    /*
     * Luego habilitamos o confirmamos habilitado
     * el secret.
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

    /*
     * Confirmamos localmente la fecha de activación.
     *
     * Este método no cambia el estado de la
     * instalación a EN_PROCESO ni COMPLETADA.
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

  /**
   * EN_PROCESO es el flujo normal.
   *
   * COMPLETADA se admite para recuperar instalaciones
   * cuyo trabajo físico terminó antes de que oficina
   * confirmara la activación.
   */

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

    if (
      typeof command.contrasenaActual !== 'string' ||
      command.contrasenaActual.trim().length === 0
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
        /*
         * Repetición idempotente.
         *
         * No reemplazamos fechaInicio.
         */
        return instalacion;

      case EstadoInstalacionCliente.COMPLETADA:
        /*
         * Compatibilidad para instalaciones históricas que
         * fueron completadas antes de activar PPPoE.
         *
         * En el nuevo flujo ya no debería ocurrir.
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
