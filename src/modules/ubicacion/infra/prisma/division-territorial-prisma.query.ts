import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { DivisionTerritorialQueryPort } from '../../domain/ports/division-territorial-query.port';
import {
  DepartamentoReadModel,
  MunicipioReadModel,
} from '../../domain/read-models/division-territorial.read-model';

const DEPARTAMENTO = { id: true, nombre: true } as const;
const MUNICIPIO = { id: true, nombre: true, departamentoId: true } as const;

@Injectable()
export class DivisionTerritorialPrismaQuery
  implements DivisionTerritorialQueryPort
{
  constructor(private readonly prisma: PrismaService) {}

  findDepartamentos(): Promise<DepartamentoReadModel[]> {
    return this.prisma.departamento.findMany({
      select: DEPARTAMENTO,
      orderBy: { nombre: 'asc' },
    });
  }

  findMunicipios(departamentoId?: number): Promise<MunicipioReadModel[]> {
    return this.prisma.municipio.findMany({
      where: { departamentoId },
      select: MUNICIPIO,
      orderBy: [{ nombre: 'asc' }, { id: 'asc' }],
    });
  }

  findDepartamento(id: number): Promise<DepartamentoReadModel | null> {
    return this.prisma.departamento.findUnique({
      where: { id },
      select: DEPARTAMENTO,
    });
  }

  findMunicipio(id: number): Promise<MunicipioReadModel | null> {
    return this.prisma.municipio.findUnique({
      where: { id },
      select: MUNICIPIO,
    });
  }
}
