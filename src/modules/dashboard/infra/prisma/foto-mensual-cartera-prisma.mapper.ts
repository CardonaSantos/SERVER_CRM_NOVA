import { Prisma } from '@prisma/client';

import { FotoMensualCarteraEntity } from '../../domain/entities/foto-mensual-cartera.entity';

export class FotoMensualCarteraPrismaMapper {
  static toCreatePersistence(
    entity: FotoMensualCarteraEntity,
  ): Prisma.FotoMensualCarteraCreateInput {
    const p = entity.toPrimitives();
    return {
      mes: p.mes,
      tomadaEn: p.tomadaEn,
      totalClientes: p.totalClientes,
      activos: p.activos,
      suspendidos: p.suspendidos,
      pendientesActivacion: p.pendientesActivacion,
      enInstalacion: p.enInstalacion,
      desinstalados: p.desinstalados,
      alDia: p.alDia,
      pagoPendiente: p.pagoPendiente,
      atrasados: p.atrasados,
      morosos: p.morosos,
      facturasConDeuda: p.facturasConDeuda,
      clientesConDeuda: p.clientesConDeuda,
      clientesConDeudaVencida: p.clientesConDeudaVencida,
      deuda: p.deuda,
      deudaVencida: p.deudaVencida,
      deudaDesinstalados: p.deudaDesinstalados,
    };
  }
}
