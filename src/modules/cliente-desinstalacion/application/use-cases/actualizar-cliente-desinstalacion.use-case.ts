import { Inject, Injectable } from '@nestjs/common';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import { ClienteDesinstalacionNoEncontradaError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  ClienteDesinstalacionResumen,
  resumirDesinstalacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';

export type ActualizarClienteDesinstalacionInput = {
  id: number;
  accesoInternetId?: number | null;
  servicioInternetId?: number | null;
  ticketId?: number | null;
  solicitadoPorId?: number | null;
  ejecutadoPorId?: number | null;
  tipo?: TipoDesinstalacionCliente;
  motivo?: MotivoDesinstalacionCliente | null;
  fechaProgramada?: string | null;
  requiereRetiroEquipo?: boolean;
  direccionServicio?: string | null;
  referenciaUbicacion?: string | null;
  latitud?: number | null;
  longitud?: number | null;
  observaciones?: string | null;
};

@Injectable()
export class ActualizarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    private readonly validarAcceso: ValidarAccesoDesinstalacionService,
  ) {}

  async execute(
    input: ActualizarClienteDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    const actuales = desinstalacion.toPrimitives();
    const accesoFinal =
      input.accesoInternetId !== undefined
        ? input.accesoInternetId
        : (actuales.accesoInternetId ?? null);

    if (accesoFinal !== null) {
      await this.validarAcceso.validar({
        clienteId: actuales.clienteId,
        accesoInternetId: accesoFinal,
      });
    }

    desinstalacion.actualizarDatosGenerales({
      servicioInternetId: input.servicioInternetId,
      ticketId: input.ticketId,
      accesoInternetId: input.accesoInternetId,
      solicitadoPorId: input.solicitadoPorId,
      ejecutadoPorId: input.ejecutadoPorId,
      tipo: input.tipo,
      motivo: input.motivo,
      fechaProgramada:
        input.fechaProgramada === undefined
          ? undefined
          : input.fechaProgramada
            ? new Date(input.fechaProgramada)
            : null,
      requiereRetiroEquipo: input.requiereRetiroEquipo,
      direccionServicio: input.direccionServicio,
      referenciaUbicacion: input.referenciaUbicacion,
      latitud: input.latitud,
      longitud: input.longitud,
      observaciones: input.observaciones,
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
