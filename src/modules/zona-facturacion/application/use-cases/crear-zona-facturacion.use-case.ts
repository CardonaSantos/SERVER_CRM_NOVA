import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ZonaFacturacionEntity } from '../../domain/entities/zona-facturacion.entity';
import {
  ZONA_FACTURACION_REPOSITORY,
  ZonaFacturacionRepositoryPort,
} from '../../domain/ports/zona-facturacion-repository.port';
import {
  CrearZonaFacturacionProps,
  ZonaFacturacionProps,
} from '../../domain/props/zona-facturacion.props';

export type CrearZonaFacturacionInput = CrearZonaFacturacionProps;

@Injectable()
export class CrearZonaFacturacionUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_REPOSITORY)
    private readonly zonas: ZonaFacturacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CrearZonaFacturacionInput,
  ): Promise<ZonaFacturacionProps> {
    const nueva = ZonaFacturacionEntity.create(input, this.reloj.ahora());

    return (await this.zonas.create(nueva)).toPrimitives();
  }
}
