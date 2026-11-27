import { Inject, Injectable } from '@nestjs/common';
import {
  SECTOR_QUERY,
  SectorQueryPort,
} from '../../domain/ports/sector-query.port';
import { SectorOpcion } from '../../domain/read-models/sector-listado.read-model';

@Injectable()
export class ListarOpcionesSectorUseCase {
  constructor(
    @Inject(SECTOR_QUERY) private readonly consulta: SectorQueryPort,
  ) {}

  execute(municipioId?: number): Promise<SectorOpcion[]> {
    return this.consulta.findOpciones(municipioId);
  }
}
