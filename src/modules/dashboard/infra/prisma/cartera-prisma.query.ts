import { Injectable } from '@nestjs/common';
import { EstadoCliente } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AgrupacionUbicacion } from '../../domain/enums/agrupacion-ubicacion.enum';
import { CarteraQueryPort } from '../../domain/ports/cartera-query.port';
import {
  ClienteConPlan,
  ClienteUbicado,
} from '../../domain/read-models/cartera.read-model';

const nombrado = { select: { id: true, nombre: true } };

@Injectable()
export class CarteraPrismaQuery implements CarteraQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findClientesConPlan(): Promise<ClienteConPlan[]> {
    const filas = await this.prisma.clienteInternet.findMany({
      where: {
        isEliminado: false,
        estadoCliente: {
          in: [EstadoCliente.ACTIVO, EstadoCliente.SUSPENDIDO],
        },
      },
      select: {
        estadoCliente: true,
        facturacionZonaId: true,
        desinstaladoEn: true,
        servicioInternet: {
          select: { id: true, nombre: true, precio: true },
        },
      },
    });

    return filas.map((c) => ({
      activo: c.estadoCliente === EstadoCliente.ACTIVO,
      tieneZona: c.facturacionZonaId !== null,
      tieneFechaDesinstalacion: c.desinstaladoEn !== null,
      plan: c.servicioInternet,
    }));
  }

  async findClientesUbicados(
    agrupar: AgrupacionUbicacion,
  ): Promise<ClienteUbicado[]> {
    const filas = await this.prisma.clienteInternet.findMany({
      where: {
        isEliminado: false,
        estadoCliente: { not: EstadoCliente.DESINSTALADO },
      },
      select: {
        id: true,
        facturacionZona: nombrado,
        sector: nombrado,
        municipio: {
          select: {
            id: true,
            nombre: true,
            departamento: { select: { nombre: true } },
          },
        },
      },
    });

    const grupoDe: Record<
      AgrupacionUbicacion,
      (c: (typeof filas)[number]) => ClienteUbicado['grupo']
    > = {
      [AgrupacionUbicacion.ZONA]: (c) => c.facturacionZona,
      [AgrupacionUbicacion.SECTOR]: (c) =>
        c.sector && { id: c.sector.id, nombre: c.sector.nombre ?? '' },
      // Hay municipios con el mismo nombre en departamentos distintos.
      [AgrupacionUbicacion.MUNICIPIO]: (c) =>
        c.municipio && {
          id: c.municipio.id,
          nombre: `${c.municipio.nombre}, ${c.municipio.departamento.nombre}`,
        },
    };

    return filas.map((c) => ({ id: c.id, grupo: grupoDe[agrupar](c) }));
  }
}
