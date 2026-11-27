import { Inject, Injectable } from '@nestjs/common';
import {
  ZONA_FACTURACION_QUERY,
  ZonaFacturacionQueryPort,
} from '../../domain/ports/zona-facturacion-query.port';
import { ZonaFacturacionOpcion } from '../../domain/read-models/zona-facturacion-listado.read-model';

@Injectable()
export class ListarOpcionesZonaFacturacionUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_QUERY)
    private readonly consulta: ZonaFacturacionQueryPort,
  ) {}

  execute(): Promise<ZonaFacturacionOpcion[]> {
    return this.consulta.findOpciones();
  }
}
