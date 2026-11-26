import { Inject, Injectable } from '@nestjs/common';
import { Money } from 'src/common/hexagonal/money.vo';
import { ClienteDesinstalacionNoEncontradaError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  ClienteDesinstalacionResumen,
  resumirDesinstalacion,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type ActualizarCostosDesinstalacionInput = {
  id: number;
  saldoClienteAlMomento?: number;
  costoDesinstalacion?: number;
  costoTransporte?: number;
  costoManoObra?: number;
  costoOtros?: number;
};

@Injectable()
export class ActualizarCostosDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,
  ) {}

  async execute(
    input: ActualizarCostosDesinstalacionInput,
  ): Promise<ClienteDesinstalacionResumen> {
    const desinstalacion = await this.desinstalaciones.findById(input.id);

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    const dinero = (valor?: number) =>
      valor === undefined ? undefined : Money.fromNumber(valor);

    desinstalacion.actualizarCostos({
      saldoClienteAlMomento: dinero(input.saldoClienteAlMomento),
      costoDesinstalacion: dinero(input.costoDesinstalacion),
      costoTransporte: dinero(input.costoTransporte),
      costoManoObra: dinero(input.costoManoObra),
      costoOtros: dinero(input.costoOtros),
    });

    return resumirDesinstalacion(
      await this.desinstalaciones.save(desinstalacion),
    );
  }
}
