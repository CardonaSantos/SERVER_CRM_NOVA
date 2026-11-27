import { Inject, Injectable } from '@nestjs/common';
import { ZonaFacturacionNoEncontradaError } from '../../domain/errors/zona-facturacion.errors';
import {
  ZONA_FACTURACION_REPOSITORY,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';

/** Confirma que a una zona se le pueden asignar clientes. */
@Injectable()
export class VerificarZonaFacturacionAsignableUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_REPOSITORY)
    private readonly zonas: ZonaFacturacionRepositoryPort,
  ) {}

  async execute(zonaId: number): Promise<void> {
    const zona = await this.zonas.findById(zonaId);
    if (!zona) throw new ZonaFacturacionNoEncontradaError();

    zona.asegurarActiva();
  }
}
