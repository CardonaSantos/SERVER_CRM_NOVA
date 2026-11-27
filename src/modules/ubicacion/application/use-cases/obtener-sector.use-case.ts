import { Inject, Injectable } from '@nestjs/common';
import { SectorNoEncontradoError } from '../../domain/errors/ubicacion.errors';
import {
  SECTOR_QUERY,
  SectorQueryPort,
} from '../../domain/ports/sector-query.port';
import { SectorListItem } from '../../domain/read-models/sector-listado.read-model';

@Injectable()
export class ObtenerSectorUseCase {
  constructor(
    @Inject(SECTOR_QUERY) private readonly consulta: SectorQueryPort,
  ) {}

  async execute(sectorId: number): Promise<SectorListItem> {
    const sector = await this.consulta.findDetail(sectorId);
    if (!sector) throw new SectorNoEncontradoError();

    return sector;
  }
}
