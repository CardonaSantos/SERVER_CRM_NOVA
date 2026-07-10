import { Inject, Injectable } from '@nestjs/common';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import {
  ClienteInstalacionDetalle,
  ClienteInstalacionRepositoryPort,
  CrearTecnicoInstalacionInput,
} from '../../domain/ports/cliente-instalacion.repository.port';
import { CrearClienteInstalacionDto } from '../dto/crear-cliente-instalacion.dto';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';

export type CrearClienteInstalacionCommand = CrearClienteInstalacionDto & {
  creadoPorId: number;
};

@Injectable()
export class CrearClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    command: CrearClienteInstalacionCommand,
  ): Promise<ClienteInstalacionDetalle> {
    const tecnicos = this.normalizarTecnicos(command.tecnicos ?? []);

    const instalacion = ClienteInstalacionEntity.create({
      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,

      ticketId: command.ticketId ?? null,

      asesorId: command.asesorId ?? null,

      creadoPorId: command.creadoPorId,

      tipo: command.tipo,

      fechaProgramada: command.fechaProgramada
        ? new Date(command.fechaProgramada)
        : null,

      direccionInstalacion: command.direccionInstalacion ?? null,

      referenciaUbicacion: command.referenciaUbicacion ?? null,

      latitud: command.latitud ?? null,

      longitud: command.longitud ?? null,

      observaciones: command.observaciones ?? null,
    });

    const created = await this.instalacionRepository.create(
      instalacion,
      tecnicos,
    );

    if (!created.id) {
      throw new Error('La instalación creada no tiene un id persistido.');
    }

    const detalle = await this.instalacionRepository.findDetailById({
      id: created.id,
    });

    if (!detalle) {
      throw new Error(
        'No fue posible obtener el detalle de la instalación creada.',
      );
    }

    return detalle;
  }

  private normalizarTecnicos(
    tecnicos: CrearClienteInstalacionDto['tecnicos'] = [],
  ): CrearTecnicoInstalacionInput[] {
    const ids = tecnicos.map((tecnico) => tecnico.tecnicoId);

    if (new Set(ids).size !== ids.length) {
      throw new Error('No se puede asignar el mismo técnico más de una vez.');
    }

    const normalizados: CrearTecnicoInstalacionInput[] = tecnicos.map(
      (tecnico) => {
        const esResponsable =
          tecnico.esResponsable === true ||
          tecnico.rol === RolTecnicoOperacionCliente.RESPONSABLE;

        return {
          tecnicoId: tecnico.tecnicoId,

          rol: esResponsable
            ? RolTecnicoOperacionCliente.RESPONSABLE
            : (tecnico.rol ?? RolTecnicoOperacionCliente.APOYO),

          esResponsable,

          observaciones: tecnico.observaciones?.trim() || null,
        };
      },
    );

    const cantidadResponsables = normalizados.filter(
      (tecnico) => tecnico.esResponsable,
    ).length;

    if (cantidadResponsables > 1) {
      throw new Error(
        'Una instalación solo puede tener un técnico responsable.',
      );
    }

    return normalizados;
  }
}
