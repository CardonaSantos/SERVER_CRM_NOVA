import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { ClienteFacturableQueryPort } from '../../domain/ports/cliente-facturable-query.port';
import {
  ClienteFacturable,
  PlanPrimeraFactura,
} from '../../domain/read-models/cliente-facturable.read-model';

/** Lee dentro de la unidad de trabajo: ve al cliente que se está creando. */
@Injectable()
export class ClienteFacturablePrismaQuery
  implements ClienteFacturableQueryPort
{
  constructor(private readonly transaccional: PrismaTransaccional) {}

  private get db() {
    return this.transaccional.cliente;
  }

  async findById(clienteId: number): Promise<ClienteFacturable | null> {
    const record = await this.db.clienteInternet.findUnique({
      where: { id: clienteId },
      select: {
        id: true,
        empresaId: true,
        nombre: true,
        apellidos: true,
        estadoCliente: true,
        isEliminado: true,
        desinstaladoEn: true,
        facturacionZona: { select: { id: true, diaPago: true } },
        servicioInternet: { select: { nombre: true, precio: true } },
      },
    });
    if (!record) return null;

    const { id, facturacionZona, servicioInternet, ...datos } = record;

    return {
      ...datos,
      clienteId: id,
      zona: facturacionZona,
      plan: servicioInternet,
    };
  }

  async findPlanPrimeraFactura(
    zonaId: number,
    servicioInternetId: number,
  ): Promise<PlanPrimeraFactura | null> {
    const zona = await this.db.facturacionZona.findUnique({
      where: { id: zonaId },
      select: { diaPago: true },
    });
    const servicio = await this.db.servicioInternet.findUnique({
      where: { id: servicioInternetId },
      select: { nombre: true, velocidad: true, precio: true },
    });

    return zona && servicio ? { ...servicio, diaPago: zona.diaPago } : null;
  }
}
