import { Inject, Injectable } from '@nestjs/common';
import {
  RutaCobroClientesInvalidosError,
  RutaCobroCobradorInvalidoError,
} from '../../domain/errors/ruta-cobro.errors';
import {
  REFERENCIA_RUTA_QUERY,
  ReferenciaRutaQueryPort,
} from '../../domain/ports/referencia-ruta-query.port';

@Injectable()
export class ValidadorReferenciasRutaService {
  constructor(
    @Inject(REFERENCIA_RUTA_QUERY)
    private readonly referencias: ReferenciaRutaQueryPort,
  ) {}

  /** Comprueba solo lo que se va a asignar: cobrador y clientes. */
  async verificar(asignacion: {
    cobradorId?: number | null;
    clienteIds?: number[];
  }): Promise<void> {
    const { cobradorId, clienteIds } = asignacion;

    if (
      typeof cobradorId === 'number' &&
      !(await this.referencias.existeCobradorActivo(cobradorId))
    ) {
      throw new RutaCobroCobradorInvalidoError();
    }

    if (
      clienteIds &&
      (await this.referencias.contarClientesAsignables(clienteIds)) !==
        clienteIds.length
    ) {
      throw new RutaCobroClientesInvalidosError();
    }
  }
}
