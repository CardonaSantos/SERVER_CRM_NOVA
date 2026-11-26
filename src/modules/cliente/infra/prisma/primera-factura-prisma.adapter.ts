import { Injectable } from '@nestjs/common';
import { PrismaTransaccional } from 'src/common/transaccion/prisma-transaccional.service';
import { periodoFrom } from 'src/facturacion/Utils';
import { dayjs } from 'src/Utils/dayjs.config';
import {
  ESTADOS_FACTURA_PENDIENTE,
  getEstadoCobranza,
} from 'src/zona-facturacion-cron/helpers/Functions';
import {
  GenerarPrimeraFactura,
  PrimeraFacturaPort,
} from '../../application/ports/primera-factura.port';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { ClienteReferenciaInvalidaError } from '../../domain/errors/cliente.errors';

/**
 * Transitorio: escribe en tablas de facturación con el mismo cálculo que tenía
 * el alta. Sale de aquí cuando exista la fachada de `facturacion`.
 */
@Injectable()
export class PrimeraFacturaPrismaAdapter implements PrimeraFacturaPort {
  constructor(private readonly transaccional: PrismaTransaccional) {}

  async generar(
    input: GenerarPrimeraFactura,
  ): Promise<{ estadoCobranza: EstadoCobranzaCliente }> {
    const db = this.transaccional.cliente;
    const { clienteId } = input;

    const zona = await db.facturacionZona.findUnique({
      where: { id: input.zonaFacturacionId },
    });
    const servicio = await db.servicioInternet.findUnique({
      where: { id: input.servicioInternetId },
    });
    if (!zona || !servicio) throw new ClienteReferenciaInvalidaError();

    const fechaBase = dayjs(input.ahora).date(zona.diaPago).toDate();

    await db.facturaInternet.create({
      data: {
        periodo: periodoFrom(fechaBase),
        fechaPagoEsperada: fechaBase,
        montoPago: servicio.precio,
        saldoPendiente: servicio.precio,
        estadoFacturaInternet: 'PENDIENTE',
        empresaId: input.empresaId,
        clienteId,
        facturacionZonaId: zona.id,
        nombreClienteFactura: `${input.nombre} ${input.apellidos ?? ''}`,
        detalleFactura: `Pago mensual servicio ${servicio.nombre} (${servicio.velocidad})`,
      },
    });

    // `ruta-cobro` aún lee este registro; el módulo de clientes ya no.
    await db.saldoCliente.create({
      data: {
        clienteId,
        totalPagos: 0,
        saldoFavor: 0,
        saldoPendiente: servicio.precio,
      },
    });

    const pendientes = await db.facturaInternet.count({
      where: {
        clienteId,
        estadoFacturaInternet: { in: ESTADOS_FACTURA_PENDIENTE },
      },
    });

    return {
      estadoCobranza: getEstadoCobranza(
        pendientes,
      ) as string as EstadoCobranzaCliente,
    };
  }
}
