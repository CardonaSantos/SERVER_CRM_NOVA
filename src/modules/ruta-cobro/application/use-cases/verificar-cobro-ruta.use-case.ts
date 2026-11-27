import { Inject, Injectable } from '@nestjs/common';
import {
  RUTA_COBRO_REPOSITORY,
  RutaCobroRepositoryPort,
} from '../../domain/ports/ruta-cobro-repository.port';

export type VerificarCobroRutaInput = { rutaId: number; clienteId: number };

@Injectable()
export class VerificarCobroRutaUseCase {
  constructor(
    @Inject(RUTA_COBRO_REPOSITORY)
    private readonly rutas: RutaCobroRepositoryPort,
  ) {}

  /** `false` si la ruta no existe o está eliminada. */
  async execute(input: VerificarCobroRutaInput): Promise<boolean> {
    await this.rutas.bloquearParaCobrar(input.rutaId);
    const ruta = await this.rutas.findById(input.rutaId);
    if (!ruta || ruta.isEliminada) return false;

    ruta.asegurarCobrable(input.clienteId);

    return true;
  }
}
