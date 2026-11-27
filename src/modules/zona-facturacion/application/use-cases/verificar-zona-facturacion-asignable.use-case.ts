import { Inject, Injectable } from '@nestjs/common';
import { ZonaFacturacionNoEncontradaError } from '../../domain/errors/zona-facturacion.errors';
import {
  ZONA_FACTURACION_REPOSITORY,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';

/**
 * Confirma que a una zona se le pueden asignar clientes y, dentro de una unidad
 * de trabajo, impide que se elimine hasta que esta termine.
 */
@Injectable()
export class VerificarZonaFacturacionAsignableUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_REPOSITORY)
    private readonly zonas: ZonaFacturacionRepositoryPort,
  ) {}

  async execute(zonaId: number): Promise<void> {
    await this.zonas.bloquearParaAsignar(zonaId);
    const zona = await this.zonas.findById(zonaId);
    if (!zona) throw new ZonaFacturacionNoEncontradaError();

    zona.asegurarActiva();
  }
}
