import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Money } from 'src/shared/domain/value-objects/money.vo';

import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ActualizarClienteInstalacionDto } from '../dto/update-instalacion.dto';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';

export type ActualizarClienteInstalacionCommand =
  ActualizarClienteInstalacionDto & {
    id: number;
  };

@Injectable()
export class ActualizarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ActualizarClienteInstalacionCommand,
  ): Promise<ClienteInstalacionEntity> {
    const instalacion = await this.instalacionRepository.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new NotFoundException(
        `No se encontró la instalación ${command.id}.`,
      );
    }

    this.validateTecnicos(command.tecnicos);

    instalacion.actualizarDatosGenerales({
      tipo: command.tipo,

      asesorId: command.asesorId,

      ticketId: command.ticketId,

      descripcion: command.descripcion,

      motivo: command.motivo,

      observaciones: command.observaciones,

      fechaProgramada:
        command.fechaProgramada !== undefined
          ? command.fechaProgramada
            ? new Date(command.fechaProgramada)
            : null
          : undefined,

      direccionInstalacion: command.direccionInstalacion,

      referenciaUbicacion: command.referenciaUbicacion,

      latitud: command.latitud,

      longitud: command.longitud,
    });

    if (command.costos !== undefined) {
      instalacion.actualizarCostos({
        costoInstalacion:
          command.costos.costoInstalacion !== undefined
            ? Money.fromNumber(command.costos.costoInstalacion)
            : undefined,

        costoMateriales:
          command.costos.costoMateriales !== undefined
            ? Money.fromNumber(command.costos.costoMateriales)
            : undefined,

        costoManoObra:
          command.costos.costoManoObra !== undefined
            ? Money.fromNumber(command.costos.costoManoObra)
            : undefined,

        costoOtros:
          command.costos.costoOtros !== undefined
            ? Money.fromNumber(command.costos.costoOtros)
            : undefined,

        montoCobradoCliente:
          command.costos.montoCobradoCliente !== undefined
            ? Money.fromNumber(command.costos.montoCobradoCliente)
            : undefined,

        notasCostos: command.costos.notasCostos,
      });
    }

    /*
     * En el siguiente paso pasaremos también
     * command.tecnicos al repositorio.
     */
    return this.instalacionRepository.save(
      instalacion,

      command.tecnicos === undefined
        ? undefined
        : command.tecnicos.map((tecnico) => ({
            tecnicoId: tecnico.tecnicoId,

            rol: tecnico.rol,

            esResponsable: tecnico.esResponsable,

            tiempoMinutos: tecnico.tiempoMinutos ?? null,

            observaciones: tecnico.observaciones ?? null,
          })),
    );
  }

  private validateTecnicos(
    tecnicos: ActualizarClienteInstalacionDto['tecnicos'] | undefined,
  ): void {
    if (tecnicos === undefined) {
      return;
    }

    const ids = tecnicos.map((tecnico) => tecnico.tecnicoId);

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'No se puede asignar el mismo técnico más de una vez.',
      );
    }

    if (tecnicos.length === 0) {
      return;
    }

    const responsables = tecnicos.filter((tecnico) => tecnico.esResponsable);

    if (responsables.length !== 1) {
      throw new BadRequestException(
        'La instalación debe tener exactamente un técnico responsable.',
      );
    }

    for (const tecnico of tecnicos) {
      if (
        tecnico.esResponsable &&
        tecnico.rol !== RolTecnicoOperacionCliente.RESPONSABLE
      ) {
        throw new BadRequestException(
          `El técnico ${tecnico.tecnicoId} marcado como responsable debe tener rol RESPONSABLE.`,
        );
      }

      if (
        !tecnico.esResponsable &&
        tecnico.rol === RolTecnicoOperacionCliente.RESPONSABLE
      ) {
        throw new BadRequestException(
          `El técnico ${tecnico.tecnicoId} con rol RESPONSABLE debe estar marcado como responsable.`,
        );
      }
    }
  }
}
