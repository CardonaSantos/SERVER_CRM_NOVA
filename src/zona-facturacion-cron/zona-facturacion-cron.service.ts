import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateZonaFacturacionCronDto } from './dto/create-zona-facturacion-cron.dto';
import { UpdateZonaFacturacionCronDto } from './dto/update-zona-facturacion-cron.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format('DD/MM/YYYY hh:mm A');
};

// Al comparar fechas, ajustamos las fechas de UTC a Guatemala (UTC-6)
const hoylocal = dayjs().tz('America/Guatemala');

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
  // '0 6 * * *'
  // @Cron(CronExpression.EVERY_10_MINUTES)
  @Cron('0 0 0 * * *', {
    timeZone: 'America/Guatemala',
  })
  async gerarFacturacionAutomaticaCron() {
    console.log(
      'Fecha ajustada a Guatemala:',
      hoylocal.format('YYYY-MM-DD HH:mm:ss'),
    );

    const zonasFacturaciones = await this.prisma.facturacionZona.findMany({
      include: {
        clientes: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            facturaInternet: {
              select: {
                id: true,
                creadoEn: true,
                fechaPagoEsperada: true,
                actualizadoEn: true,
                fechaPagada: true,
                pagos: true,
              },
            },
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

    // Iterar por cada zona de facturación
    for (const zona of zonasFacturaciones) {
      const fechaGeneracion = dayjs().date(zona.diaGeneracionFactura);

      // Compara las fechas ajustadas a Guatemala
      if (hoylocal.isSame(fechaGeneracion, 'day')) {
        for (const cliente of zona.clientes) {
          const facturasEsteMes = cliente.facturaInternet.filter((fact) => {
            const creadoEn = dayjs(fact.creadoEn).tz('America/Guatemala');
            const fechaPagoEsperada = dayjs(fact.fechaPagoEsperada).tz(
              'America/Guatemala',
            );

            return (
              creadoEn.isSame(hoylocal, 'month') &&
              creadoEn.isSame(hoylocal, 'year') &&
              fechaPagoEsperada.isSame(hoylocal, 'month') &&
              fechaPagoEsperada.isSame(hoylocal, 'year')
            );
          });

          // Verifica si el cliente tiene servicio de internet y no tiene facturas generadas este mes
          if (cliente.servicioInternet && facturasEsteMes.length <= 0) {
            console.log('El cliente es: ', cliente);
            const dataFactura: DatosFacturaGenerate = {
              datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${zona.diaPago}`,
              fechaPagoEsperada: hoylocal
                .date(zona.diaPago) // Establece el día de la fecha
                .month(hoylocal.month()) // Usa el mes actual de Guatemala
                .year(hoylocal.year()) // Usa el año actual de Guatemala
                .isBefore(hoylocal, 'day') // Si la fecha es antes de hoy, pasa al siguiente mes
                ? hoylocal.add(1, 'month').date(zona.diaPago).format() // Si es antes, agrega un mes
                : hoylocal.date(zona.diaPago).format(), // Si no es antes, usa el mes actual
              montoPago: cliente.servicioInternet.precio,
              saldoPendiente: cliente.servicioInternet.precio,
              estadoFacturaInternet: 'PENDIENTE',
              cliente: cliente.id,
              facturacionZona: zona.id,
              nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
            };

            // Llama al servicio para crear la factura
            await this.generarFacturaClientePorZona(dataFactura);
          } else {
            console.error(
              `El cliente ${cliente.nombre} ${cliente.apellidos} no tiene servicio de internet asociado o ya tiene una factura creada.`,
            );
            console.log('Facturas creadas previas: ', facturasEsteMes);
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

      const nuevoEstadoCliente = await this.prisma.clienteInternet.findUnique({
        where: {
          id: nuevoEstadoSaldoCliente.clienteId,
        },
      });

      if (!nuevoEstadoCliente) {
        throw new NotFoundException('Error al encontrar cliente');
      }

      const newStateCustomer = await this.prisma.clienteInternet.update({
        where: {
          id: nuevoEstadoCliente.id,
        },
        data: {
          estadoCliente: 'MOROSO',
        },
      });

      console.log('el nuevo state del cliente es: ', newStateCustomer);

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
