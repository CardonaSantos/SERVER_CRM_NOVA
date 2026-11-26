import { Inject, Injectable } from '@nestjs/common';
import { Money } from 'src/common/hexagonal/money.vo';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';
import { ClienteInstalacionNoEncontradaError } from '../../domain/errors/cliente-instalacion.errors';
import { validarTecnicosActualizacion } from '../../domain/policies/tecnicos-instalacion.policy';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';
import {
  ClienteInstalacionResumen,
  resumirInstalacion,
} from '../../domain/read-models/cliente-instalacion-resumen.read-model';

export type ActualizarClienteInstalacionInput = {
  id: number;
  tipo?: TipoInstalacionCliente;
  asesorId?: number | null;
  ticketId?: number | null;
  descripcion?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  fechaProgramada?: string | null;
  direccionInstalacion?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  costos?: {
    costoInstalacion?: number;
    costoMateriales?: number;
    costoManoObra?: number;
    costoOtros?: number;
    montoCobradoCliente?: number;
    notasCostos?: string | null;
  };
  /** Ausente: no toca las asignaciones. Presente: reemplaza el conjunto completo. */
  tecnicos?: {
    tecnicoId: number;
    rol: RolTecnicoOperacionCliente;
    esResponsable: boolean;
    tiempoMinutos?: number | null;
    observaciones?: string | null;
  }[];
};

@Injectable()
export class ActualizarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    input: ActualizarClienteInstalacionInput,
  ): Promise<ClienteInstalacionResumen> {
    const instalacion = await this.instalaciones.findById(input.id);

    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    if (input.tecnicos !== undefined) {
      validarTecnicosActualizacion(input.tecnicos);
    }

    instalacion.actualizarDatosGenerales({
      tipo: input.tipo,
      asesorId: input.asesorId,
      ticketId: input.ticketId,
      descripcion: input.descripcion,
      motivo: input.motivo,
      observaciones: input.observaciones,
      fechaProgramada:
        input.fechaProgramada === undefined
          ? undefined
          : input.fechaProgramada
            ? new Date(input.fechaProgramada)
            : null,
      direccionInstalacion: input.direccionInstalacion,
      referenciaUbicacion: input.referenciaUbicacion,
      latitud: input.latitud,
      longitud: input.longitud,
    });

    if (input.costos !== undefined) {
      const costos = input.costos;
      const dinero = (valor?: number) =>
        valor === undefined ? undefined : Money.fromNumber(valor);

      instalacion.actualizarCostos({
        costoInstalacion: dinero(costos.costoInstalacion),
        costoMateriales: dinero(costos.costoMateriales),
        costoManoObra: dinero(costos.costoManoObra),
        costoOtros: dinero(costos.costoOtros),
        montoCobradoCliente: dinero(costos.montoCobradoCliente),
        notasCostos: costos.notasCostos,
      });
    }

    const guardada = await this.instalaciones.save(
      instalacion,
      input.tecnicos?.map((tecnico) => ({
        tecnicoId: tecnico.tecnicoId,
        rol: tecnico.rol,
        esResponsable: tecnico.esResponsable,
        tiempoMinutos: tecnico.tiempoMinutos ?? null,
        observaciones: tecnico.observaciones ?? null,
      })),
    );

    return resumirInstalacion(guardada);
  }
}
