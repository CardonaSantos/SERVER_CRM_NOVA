import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  aDesplazamiento,
  crearResultadoPaginado,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlantillaContratoQueryPort } from '../../domain/ports/plantilla-contrato-query.port';
import {
  PlantillaContratoFiltros,
  PlantillaContratoListItem,
} from '../../domain/read-models/plantilla-contrato-listado.read-model';

@Injectable()
export class PlantillaContratoPrismaQuery
  implements PlantillaContratoQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  async findMany(
    filtros: PlantillaContratoFiltros,
  ): Promise<ResultadoPaginado<PlantillaContratoListItem>> {
    const where: Prisma.PlantillaContratoWhereInput = filtros.search
      ? { nombre: { contains: filtros.search, mode: 'insensitive' } }
      : {};

    const [items, total] = await this.prisma.$transaction([
      this.prisma.plantillaContrato.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          creadoEn: true,
          actualizadoEn: true,
        },
        orderBy: [{ [filtros.sortBy]: filtros.sortDir }, { id: 'asc' }],
        ...aDesplazamiento(filtros),
      }),
      this.prisma.plantillaContrato.count({ where }),
    ]);

    return crearResultadoPaginado(items, total, filtros);
  }
}
