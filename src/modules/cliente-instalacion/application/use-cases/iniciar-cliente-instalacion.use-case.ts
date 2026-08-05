import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { IniciarInstalacionClienteDto } from '../dto/iniciar-instalacion.dto';

import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

export type IniciarInstalacionClienteCommand = IniciarInstalacionClienteDto & {
  id: number;

  /**
   * Identidad obtenida exclusivamente del JWT.
   */
  tecnicoId: number;

  /**
   * Empresa obtenida exclusivamente del JWT.
   */
  empresaId: number;

  /**
   * Rol obtenido exclusivamente del JWT.
   */
  actorRol: string;
};

/**
 * Inicia únicamente el trabajo físico de campo.
 *
 * Responsabilidades:
 *
 * 1. valida que el actor sea técnico;
 * 2. valida que tenga asignada la instalación;
 * 3. valida que pertenezca a la misma empresa;
 * 4. cambia PROGRAMADA o REPROGRAMADA a EN_PROCESO;
 * 5. establece fechaInicio;
 * 6. persiste la instalación.
 *
 * No ejecuta prealta, creación de secrets,
 * activación PPPoE, SSH ni reautenticación.
 */
@Injectable()
export class IniciarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly clienteInstalacion: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: IniciarInstalacionClienteCommand) {
    this.validateCommand(command);

    this.assertTechnicianRole(command.actorRol);

    const instalacion =
      await this.clienteInstalacion.findByIdAssignedToTechnician({
        instalacionId: command.id,

        tecnicoId: command.tecnicoId,

        empresaId: command.empresaId,
      });

    /*
     * Retornamos 404 en lugar de revelar si existe
     * una instalación perteneciente a otro técnico
     * o a otra empresa.
     */
    if (!instalacion) {
      throw new NotFoundException(
        'No se encontró una instalación asignada al técnico autenticado.',
      );
    }

    const estadoActual = instalacion.toPrimitives().estado;

    /*
     * Idempotencia:
     *
     * una repetición HTTP no vuelve a establecer
     * fechaInicio ni produce otra transición.
     */
    if (estadoActual === EstadoInstalacionCliente.EN_PROCESO) {
      return instalacion;
    }

    this.assertCanStart(estadoActual);

    const fechaInicio = this.parseFechaInicio(command.fechaInicio);

    instalacion.iniciar({
      fechaInicio,
    });

    return this.clienteInstalacion.save(instalacion);
  }

  private assertCanStart(estado: EstadoInstalacionCliente): void {
    const estadosPermitidos: EstadoInstalacionCliente[] = [
      EstadoInstalacionCliente.PROGRAMADA,
      EstadoInstalacionCliente.REPROGRAMADA,
    ];

    if (estadosPermitidos.includes(estado)) {
      return;
    }

    throw new ConflictException(
      `No puede iniciarse la instalación desde el estado ${estado}.`,
    );
  }

  private assertTechnicianRole(actorRol: string): void {
    const normalizedRole = actorRol.trim().toUpperCase();

    if (normalizedRole === 'TECNICO') {
      return;
    }

    throw new ForbiddenException(
      'Solo un técnico puede iniciar el trabajo de instalación.',
    );
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

  private validateCommand(command: IniciarInstalacionClienteCommand): void {
    this.assertPositiveInteger(command.id, 'id');

    this.assertPositiveInteger(command.tecnicoId, 'tecnicoId');

    this.assertPositiveInteger(command.empresaId, 'empresaId');

    if (typeof command.actorRol !== 'string' || !command.actorRol.trim()) {
      throw new ForbiddenException(
        'No fue posible determinar el rol del usuario autenticado.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
