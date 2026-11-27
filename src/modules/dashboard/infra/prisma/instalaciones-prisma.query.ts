import { Injectable } from '@nestjs/common';
import {
  fechaNegocioDe,
  rangoDiasNegocio,
} from 'src/common/reloj/fecha-negocio';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  RangoFechas,
  sumarDias,
} from '../../domain/policies/calendario.policy';
import { InstalacionesQueryPort } from '../../domain/ports/instalaciones-query.port';
import { TrabajosDeCampoFinalizados } from '../../domain/read-models/instalaciones.read-model';

@Injectable()
export class InstalacionesPrismaQuery implements InstalacionesQueryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findFinalizadas(
    rango: RangoFechas,
  ): Promise<TrabajosDeCampoFinalizados> {
    // Actividad histórica: cuenta aunque el cliente se haya eliminado después.
    const where = {
      estado: 'COMPLETADA' as const,
      fechaFinalizacion: rangoDiasNegocio(
        rango.desde,
        sumarDias(rango.hastaExclusivo, -1),
      ),
    };
    const select = { fechaFinalizacion: true };

    const [instalaciones, desinstalaciones] = await Promise.all([
      this.prisma.clienteInstalacion.findMany({ where, select }),
      this.prisma.clienteDesinstalacion.findMany({ where, select }),
    ]);
    const fecha = (fila: { fechaFinalizacion: Date | null }) =>
      fechaNegocioDe(fila.fechaFinalizacion!);

    return {
      instalaciones: instalaciones.map(fecha),
      desinstalaciones: desinstalaciones.map(fecha),
    };
  }
}
