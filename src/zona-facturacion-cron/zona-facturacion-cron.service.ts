import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateZonaFacturacionCronDto } from './dto/create-zona-facturacion-cron.dto';
import { UpdateZonaFacturacionCronDto } from './dto/update-zona-facturacion-cron.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { TwilioService } from 'src/twilio/twilio.service';

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
  // Otros campos para el mensaje
  datalleFacturaParaMensaje?: string;
  numerosTelefono?: string[];
}

@Injectable()
export class ZonaFacturacionCronService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly twilioService: TwilioService,
  ) {}
  // '0 6 * * *'
  //'0 0 0 * * *'
  // '0 0 0 * * *'
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
            telefono: true,
            contactoReferenciaTelefono: true,
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
            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((num) => num.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((num) => num.trim()),
            ];

            const dataFactura: DatosFacturaGenerate = {
              datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${zona.diaPago}`,

              datalleFacturaParaMensaje: `Pago por suscripción mensual al servicio de internet, Plan: ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad})`,

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
              //NUMERO DE TELEFONO PARA TWILIO
              numerosTelefono: numerosTelefono,
            };

            // Llama al servicio para crear la factura
            await this.generarFacturaClientePorZona(dataFactura);
            // await this.generarFacturaClientePorZona(dataFactura);
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
      //COMENTADO POR EL MOMENTO, HASTA QUE TENGA EL NUMERO DE TWILIO Y LAS DEMAS IMPLEMENTADAS
      // await this.generarMensajeGeneracionFactura(dataFactura);
    } catch (error) {
      console.error('Error al generar la factura:', error);
    }
  }

  async generarMensajeGeneracionFactura(dataFactura: DatosFacturaGenerate) {
    try {
      const infoEmpresa = await this.prisma.empresa.findFirst({
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      });

      const infoCliente = await this.prisma.clienteInternet.findUnique({
        where: {
          id: dataFactura.cliente,
        },
      });

      const templateMensaje = await this.prisma.plantillaMensaje.findFirst({
        where: {
          tipo: 'GENERACION_FACTURA',
        },
        select: {
          body: true,
        },
      });

      if (!templateMensaje) {
        throw new NotFoundException(
          'Error al encontrar plantilla de mensaje, no se pueden crear los mensajes',
        );
      }

      const dataToTemplate = {
        nombre_cliente: `${infoCliente.nombre} ${infoCliente.apellidos}`,
        empresa_nombre: infoEmpresa.nombre,
        fecha_pago: formatearFecha(dataFactura.fechaPagoEsperada),
        monto_pago: dataFactura.montoPago,
        detalle_factura: dataFactura.datalleFacturaParaMensaje,
      };

      const bodyMensaje = this.renderTemplate(
        templateMensaje.body,
        dataToTemplate,
      );

      const numerosValidos = dataFactura.numerosTelefono
        .map((n) => {
          try {
            return this.formatearNumeroWhatsApp(n);
          } catch (err) {
            console.warn(`Número descartado: ${n} -> ${err.message}`);
            return null;
          }
        })
        .filter(Boolean); // elimina nulls

      // Enviar el mensaje a través de Twilio
      for (const numero of numerosValidos) {
        try {
          await this.twilioService.sendWhatsApp(numero, bodyMensaje);
          console.log('Mensaje enviado a:', numero);
        } catch (err) {
          console.warn('Error al enviar mensaje a', numero, err.message);
        }
      }

      console.log('El mensaje a enviar es: ', bodyMensaje);
    } catch (error) {
      console.log(error);
    }
  }

  //GENERAR EL PRIMER RECORDATORIO DE PAGO, NO ES LA GENERACION DE FACTURA
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Guatemala',
  })
  async generarMesnajePrimerRecordatorio() {
    try {
      const hoylocal = dayjs().tz('America/Guatemala');
      //usa el mismo hoylocal, para definir el fin e inicio de mes
      const inicioMesLocal = hoylocal.startOf('month');
      const finMesLocal = hoylocal.endOf('month');

      const zonasDeFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          diaRecordatorio: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              contactoReferenciaTelefono: true,
            },
          },
        },
      });

      for (const zona of zonasDeFacturacion) {
        if (!zona.diaRecordatorio) continue;

        const fechaRecordatorio = hoylocal.date(zona.diaRecordatorio);

        if (hoylocal.isSame(fechaRecordatorio, 'day')) {
          for (const cliente of zona.clientes) {
            const factura = await this.prisma.facturaInternet.findFirst({
              where: {
                clienteId: cliente.id,
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
                },
                facturacionZonaId: zona.id,
                fechaPagoEsperada: {
                  gte: inicioMesLocal.toDate(),
                  lte: finMesLocal.endOf('month').toDate(),
                },
              },
              select: {
                id: true,
                fechaPagoEsperada: true,
                detalleFactura: true,
                montoPago: true,
              },
            });

            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((num) => num.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((num) => num.trim()),
            ];

            console.log('los numeros de telefono son: ', numerosTelefono);
          }
        }
      }
    } catch (error) {
      console.log('❌ Error en CRON primer recordatorio:', error);
    }
  }

  renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\[([^\]]+)\]/g, (_, key) => {
      const value = data[key];
      return value !== undefined ? String(value) : `[${key}]`;
    });
  }

  formatearNumeroWhatsApp(numero: string): string {
    // Limpiar caracteres no numéricos
    const limpio = numero.trim().replace(/\D/g, '');

    // Si ya tiene el código completo
    if (limpio.startsWith('502') && limpio.length === 11) {
      return `whatsapp:+${limpio}`;
    }

    // Si es número nacional (8 dígitos)
    if (limpio.length === 8) {
      return `whatsapp:+502${limpio}`;
    }

    // Si ya viene con prefijo internacional completo (ej: +502)
    if (numero.startsWith('+')) {
      return `whatsapp:${numero}`;
    }

    // Número inválido
    throw new Error(`Número no válido o mal formateado: "${numero}"`);
  }
}
