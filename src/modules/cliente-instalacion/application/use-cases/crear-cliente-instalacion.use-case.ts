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

    const coordenadas = this.parseCoordenadas(command.coordenadas);

    const instalacion = ClienteInstalacionEntity.create({
      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,

      ticketId: command.ticketId ?? null,

      asesorId: command.asesorId ?? null,

      creadoPorId: command.creadoPorId,

      tipo: command.tipo,

      estado: command.estado,

      descripcion: command.descripcion ?? null,

      motivo: command.motivo ?? null,

      observaciones: command.observaciones ?? null,

      fechaProgramada: command.fechaProgramada
        ? new Date(command.fechaProgramada)
        : null,

      fechaInicio: command.fechaInicio ? new Date(command.fechaInicio) : null,

      direccionInstalacion: command.direccionInstalacion ?? null,

      referenciaUbicacion: command.referenciaUbicacion ?? null,

      latitud: coordenadas?.latitud ?? null,

      longitud: coordenadas?.longitud ?? null,

      costos: command.costos
        ? {
            costoInstalacion: command.costos.costoInstalacion,

            costoMateriales: command.costos.costoMateriales,

            costoManoObra: command.costos.costoManoObra,

            costoOtros: command.costos.costoOtros,

            montoCobradoCliente: command.costos.montoCobradoCliente,

            notas: command.costos.notas ?? null,
          }
        : undefined,
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

  private parseCoordenadas(value?: string): {
    latitud: number;
    longitud: number;
  } | null {
    if (!value?.trim()) {
      return null;
    }

    const parts = value.split(',').map((part) => part.trim());

    if (parts.length !== 2) {
      throw new Error(
        'Las coordenadas deben tener el formato "latitud, longitud".',
      );
    }

    const latitud = Number(parts[0]);
    const longitud = Number(parts[1]);

    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      throw new Error('Las coordenadas proporcionadas no son válidas.');
    }

    if (latitud < -90 || latitud > 90) {
      throw new Error('La latitud debe estar entre -90 y 90.');
    }

    if (longitud < -180 || longitud > 180) {
      throw new Error('La longitud debe estar entre -180 y 180.');
    }

    return {
      latitud,
      longitud,
    };
  }
}
