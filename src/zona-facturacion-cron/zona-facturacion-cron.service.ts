import { Injectable } from '@nestjs/common';
import { CreateZonaFacturacionCronDto } from './dto/create-zona-facturacion-cron.dto';
import { UpdateZonaFacturacionCronDto } from './dto/update-zona-facturacion-cron.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';

interface DatosFacturaGenerate {
  fechaPagoEsperada: string;

  montoPago: number;
  saldoPendiente: number;
  datalleFactura: string;
  estadoFacturaInternet: string;
  cliente: number;
  facturacionZona: number;
  nombreClienteFactura: string;
}

@Injectable()
export class ZonaFacturacionCronService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async gerarFacturacionAutomaticaCron() {
    const zonasFacturaciones = await this.prisma.facturacionZona.findMany({
      include: {
        clientes: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
              },
            },
            empresa: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
      },
    });

    console.log('Las zonas de facturacion son: ', zonasFacturaciones);

    for (const zona of zonasFacturaciones) {
      const today = dayjs();
      const fechaGeneracion = dayjs().date(zona.diaGeneracionFactura);
      // Compara las fechas
      if (today.isSame(fechaGeneracion, 'day')) {
        for (const cliente of zona.clientes) {
          // Verifica si el cliente tiene servicio de internet
          if (cliente.servicioInternet) {
            console.log('El cliente es: ', cliente);
            const dataFactura: DatosFacturaGenerate = {
              datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${zona.diaPago}`,
              fechaPagoEsperada: dayjs()
                .date(zona.diaPago) // Establece el día de la fecha
                .month(dayjs().month()) // Establece el mes actual
                .year(dayjs().year()) // Establece el año actual
                .isBefore(dayjs(), 'day') // Si la fecha es antes de hoy, pasa al siguiente mes
                ? dayjs().add(1, 'month').date(zona.diaPago).format() // Si es antes, agregamos un mes
                : dayjs().date(zona.diaPago).format(), // Si no es antes, usa el mes actual
              montoPago: cliente.servicioInternet.precio,
              saldoPendiente: cliente.servicioInternet.precio,
              estadoFacturaInternet: 'PENDIENTE',
              cliente: cliente.id,
              facturacionZona: zona.id,
              nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
            };

            // Ahora pasamos el objeto dataFactura al servicio para crear la factura
            await this.generarFacturaClientePorZona(dataFactura); // Pasa el objeto creado
          } else {
            console.error(
              `El cliente ${cliente.nombre} ${cliente.apellidos} no tiene servicio de internet asociado.`,
            );
          }
        }
      } else {
        console.log('NO HAY FACTURAS CORRESPONDIENTES PARA CREAR');
      }
    }
  }

  async generarFacturaClientePorZona(dataFactura: DatosFacturaGenerate) {
    try {
      // Aquí creas la factura con los datos pasados
      const newFacturaInternet = await this.prisma.facturaInternet.create({
        data: {
          fechaPagoEsperada: dayjs(dataFactura.fechaPagoEsperada).toDate(),
          montoPago: dataFactura.montoPago,
          saldoPendiente: dataFactura.saldoPendiente,
          estadoFacturaInternet: 'PENDIENTE',
          cliente: {
            connect: { id: dataFactura.cliente },
          },
          facturacionZona: {
            connect: { id: dataFactura.facturacionZona },
          },
          nombreClienteFactura: dataFactura.nombreClienteFactura,
          detalleFactura: dataFactura.datalleFactura,
          empresa: {
            connect: {
              id: 1,
            },
          },
        },
      });

      const nuevoEstadoSaldoCliente = await this.prisma.saldoCliente.update({
        where: {
          id: newFacturaInternet.clienteId,
        },
        data: {
          saldoPendiente: {
            increment: newFacturaInternet.montoPago,
          },
        },
      });

      console.log(
        'el nuevo estado de cuenta del cliente es: ',
        nuevoEstadoSaldoCliente,
      );

      console.log('Factura creada con éxito:', newFacturaInternet);
    } catch (error) {
      console.error('Error al generar la factura:', error);
    }
  }

  async generarRutaCobro() {}
  create(createZonaFacturacionCronDto: CreateZonaFacturacionCronDto) {
    return 'This action adds a new zonaFacturacionCron';
  }
}
