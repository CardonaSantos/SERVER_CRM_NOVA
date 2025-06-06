import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { TwilioService } from 'src/twilio/twilio.service';
import { EstadoCliente } from '@prisma/client';

// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format('DD/MM/YYYY');
};

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

  @Cron(CronExpression.EVERY_MINUTE)
  // @Cron('0 0 0 * * *', {
  //   timeZone: 'America/Guatemala',
  // })
  //ejecutar cada minuto
  async gerarFacturacionAutomaticaCron() {
    // 1) Cada vez que entra el cron, recalculamos “hoy en GMT-6”
    const hoylocal = dayjs().tz('America/Guatemala');
    console.log(
      '▶️  Fecha en Guatemala (hoylocal):',
      hoylocal.format('YYYY-MM-DD HH:mm:ss'),
    );

    // 2) Traemos las zonas y sus clientes
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

    // 3) Iteramos cada zona de facturación
    for (const zona of zonasFacturaciones) {
      const fechaGeneracion = hoylocal
        .date(zona.diaGeneracionFactura) // día del mes
        .startOf('day'); // 00:00:00 de ese día GMT-6

      console.log(
        `→ Zona ${zona.id}: díaGeneración = ${zona.diaGeneracionFactura}, fechaGeneracion = ${fechaGeneracion.format('YYYY-MM-DD HH:mm:ss')}`,
      );

      if (hoylocal.isSame(fechaGeneracion, 'day')) {
        // Si coincide el día → crear factura y notificar
        for (const cliente of zona.clientes) {
          // ---- Lógica para filtrar facturas de este mes ----
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

          // Si el cliente tiene servicio y todavía no existe factura este mes:
          if (cliente.servicioInternet && facturasEsteMes.length <= 0) {
            // Armar números de teléfono, cálculo de dataFactura, etc.
            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((n) => n.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((n) => n.trim()),
            ];

            const cleanName = cliente.servicioInternet.nombre.replace(
              /^plan\s*/i,
              '',
            );

            // Preparar el objeto a enviar a la creación de factura
            const dataFactura: DatosFacturaGenerate = {
              datalleFactura:
                `Pago por suscripción mensual al servicio de internet: ${cleanName} ` +
                `Q${cliente.servicioInternet.precio} — Fecha de pago: ${zona.diaPago}`,
              fechaPagoEsperada: hoylocal
                .date(zona.diaPago)
                .month(hoylocal.month())
                .year(hoylocal.year())
                .isBefore(hoylocal, 'day')
                ? hoylocal.add(1, 'month').date(zona.diaPago).format()
                : hoylocal.date(zona.diaPago).format(),
              montoPago: cliente.servicioInternet.precio,
              saldoPendiente: cliente.servicioInternet.precio,
              estadoFacturaInternet: 'PENDIENTE',
              cliente: cliente.id,
              facturacionZona: zona.id,
              nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
              numerosTelefono: numerosTelefono,
            };

            // Llamar a la función que crea en BD y notifica por WhatsApp
            await this.generarFacturaClientePorZona(dataFactura);
          } else {
            console.error(
              `El cliente ${cliente.nombre} ${cliente.apellidos} no tiene servicio o ya tiene factura este mes.`,
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
      // 1) Crear la factura en la tabla facturaInternet
      const newFactura = await this.prisma.facturaInternet.create({
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
              id: 1, // o el ID que corresponda
            },
          },
        },
      });

      // 2) Actualizar el saldo pendiente del cliente
      await this.prisma.saldoCliente.update({
        where: { clienteId: newFactura.clienteId },
        data: { saldoPendiente: { increment: newFactura.montoPago } },
      });

      const facturasPendientes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId: newFactura.clienteId,
          estadoFacturaInternet: {
            in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
          },
        },
      });

      const estadoPendiente = facturasPendientes.length;
      let estadoCliente: EstadoCliente;

      switch (estadoPendiente) {
        case 0:
          estadoCliente = 'ACTIVO';
          break;

        case 1:
          estadoCliente = 'PENDIENTE_ACTIVO';
          break;

        case 2:
          estadoCliente = 'ATRASADO';
          break;

        case 3:
          estadoCliente = 'MOROSO';
          break;

        default:
          break;
      }

      // 3) Marcar al cliente como “MOROSO” (o el estado que corresponda)
      await this.prisma.clienteInternet.update({
        where: { id: newFactura.clienteId },
        data: { estadoCliente: estadoCliente },
      });

      // 4) Ahora recuperamos datos necesarios para el mensaje
      const cliente = await this.prisma.clienteInternet.findUnique({
        where: { id: newFactura.clienteId },
        select: {
          nombre: true,
          apellidos: true,
          telefono: true,
          contactoReferenciaTelefono: true,
          empresaId: true,
          servicioInternet: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      });

      if (!cliente) {
        throw new NotFoundException(
          `Cliente con ID ${newFactura.clienteId} no encontrado`,
        );
      }

      const empresa = await this.prisma.empresa.findUnique({
        where: { id: cliente.empresaId ?? 1 },
        select: { nombre: true },
      });
      if (!empresa) {
        throw new NotFoundException(
          `Empresa con ID ${cliente.empresaId} no encontrada`,
        );
      }

      // 5) Armar lista de números WhatsApp válidos
      const telefonosRaw = [
        ...(cliente.telefono ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
        ...(cliente.contactoReferenciaTelefono ?? '')
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t !== ''),
      ];

      const destinos = telefonosRaw
        .map((tel) => {
          const limpio = tel.replace(/\D/g, '');
          // Si ya trae código de país 502 + 8 dígitos (Total 11 dígitos)
          if (limpio.startsWith('502') && limpio.length === 11) {
            return `whatsapp:+${limpio}`;
          }
          // Si es solo 8 dígitos (nacional), anteponer +502
          if (limpio.length === 8) {
            return `whatsapp:+502${limpio}`;
          }
          // Si ya viene con + código
          if (tel.startsWith('+')) {
            return `whatsapp:${tel}`;
          }
          // Número inválido
          return null;
        })
        .filter((t): t is string => !!t);

      // 6) Enviar WhatsApp a cada número con la plantilla registrada en Twilio
      //    (reemplaza "HXTU-TEMPLATE-SID-AQUI" con el SID de tu plantilla)
      const templateSid = 'HX4a8090d6cb83f7548c5e48bbee7fc304';
      const mesFactura = dayjs(newFactura.fechaPagoEsperada).format(
        'MMMM YYYY',
      );
      // → "junio 2025" (asegúrate de tener el locale en español si quieres "junio" y no "June")

      for (const destino of destinos) {
        try {
          await this.twilioService.sendWhatsAppTemplate(
            destino,
            templateSid, // e.g. "HX4a8090d6cb83f7548c5e48bbee7fc304"
            {
              '1': `${cliente.nombre} ${cliente.apellidos}`, // "María López"
              '2': empresa.nombre, // "Nova Sistemas S.A."
              '3': mesFactura, // "junio 2025"
              '4': newFactura.montoPago.toFixed(2), // e.g. "200.00"
              '5': dayjs(newFactura.fechaPagoEsperada).format('DD/MM/YYYY'), // "10/06/2025"
            },
          );
          console.log(`Factura notificada a ${destino}`);
        } catch (err) {
          console.error(`Error al enviar WhatsApp a ${destino}:`, err);
        }
      }

      return newFactura;
    } catch (error) {
      console.error('Error al generar la factura y notificar:', error);
      throw error;
    }
  }

  //GENERAR EL PRIMER RECORDATORIO DE PAGO, NO ES LA GENERACION DE FACTURA
  @Cron(CronExpression.EVERY_DAY_AT_1PM, {
    timeZone: 'America/Guatemala',
  })
  async generarMesnajePrimerRecordatorio() {
    try {
      console.log('ejecutandso el cron..');

      const hoylocal = dayjs().tz('America/Guatemala');
      const inicioMesLocal = hoylocal.startOf('month');
      const finMesLocal = hoylocal.endOf('month');

      const infoEmpresa = await this.prisma.empresa.findFirst({
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      });

      if (!infoEmpresa) {
        console.warn('Empresa no encontrada. Abortando ejecución.');
        return;
      }

      const bodyTemplate = await this.prisma.plantillaMensaje.findFirst({
        where: {
          tipo: 'RECORDATORIO_1',
        },
      });

      if (!bodyTemplate) {
        console.warn('Plantilla RECORDATORIO_1 no encontrada.');
        return;
      }

      const zonasDeFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          diaRecordatorio: true,
          enviarRecordatorio1: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              servicioInternet: {
                select: {
                  nombre: true,
                  velocidad: true,
                },
              },
            },
          },
        },
      });

      for (const zona of zonasDeFacturacion) {
        if (!zona.diaRecordatorio) continue;
        if (zona.enviarRecordatorio1 === false) continue;

        const fechaRecordatorio = hoylocal.date(zona.diaRecordatorio);

        if (!hoylocal.isSame(fechaRecordatorio, 'day')) continue;

        for (const cliente of zona.clientes) {
          try {
            const factura = await this.prisma.facturaInternet.findFirst({
              where: {
                clienteId: cliente.id,
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
                },
                facturacionZonaId: zona.id,
                fechaPagoEsperada: {
                  gte: inicioMesLocal.toDate(),
                  lte: finMesLocal.toDate(),
                },
              },
              select: {
                fechaPagoEsperada: true,
                detalleFactura: true,
                montoPago: true,
              },
            });

            if (!factura) continue;

            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((num) => num.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((num) => num.trim()),
            ].filter((num) => num);

            const numerosValidos = numerosTelefono
              .map((n) => {
                try {
                  return this.formatearNumeroWhatsApp(n);
                } catch (err) {
                  console.warn(`Número descartado: ${n} -> ${err.message}`);
                  return null;
                }
              })
              .filter(Boolean);

            for (const numero of numerosValidos) {
              try {
                await this.twilioService.sendWhatsAppTemplate(
                  numero,
                  'HX9617108422a5ba77e77a0bee65362772', // contentSid
                  {
                    '1': `${cliente.nombre} ${cliente.apellidos}`,
                    '2': factura.montoPago.toString(), // ¡Asegúrate de convertirlo a string!
                    '3': formatearFecha(
                      factura.fechaPagoEsperada.toISOString(),
                    ), // Ya devuelve string
                    '4': infoEmpresa.nombre,
                  },
                );
              } catch (error) {
                console.log('El error es: ', error);
                return error;
              }
            }
          } catch (clienteError) {
            console.warn(
              `Error procesando cliente ${cliente.id}:`,
              clienteError,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Error general en CRON primer recordatorio:', error);
    }
  }

  // ENVIAR EL SEGUNDO RECORDATORIO DE PAGO, NO ES GENERACION DE FACTURA
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Guatemala',
  })
  async generarMensajeSegundoRecordatorio() {
    try {
      const hoylocal = dayjs().tz('America/Guatemala');
      const inicioMesLocal = hoylocal.startOf('month');
      const finMesLocal = hoylocal.endOf('month');

      const infoEmpresa = await this.prisma.empresa.findFirst({
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      });

      if (!infoEmpresa) {
        console.warn('Empresa no encontrada. Abortando ejecución.');
        return;
      }

      const bodyTemplate = await this.prisma.plantillaMensaje.findFirst({
        where: {
          tipo: 'RECORDATORIO_2',
        },
      });

      if (!bodyTemplate) {
        console.warn('Plantilla RECORDATORIO_2 no encontrada.');
        return;
      }

      const zonasDeFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          diaSegundoRecordatorio: true,
          enviarRecordatorio2: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              servicioInternet: {
                select: {
                  nombre: true,
                  velocidad: true,
                },
              },
            },
          },
        },
      });

      for (const zona of zonasDeFacturacion) {
        if (!zona.diaSegundoRecordatorio) continue;
        if (zona.enviarRecordatorio2 === false) continue;

        const fechaRecordatorio = hoylocal.date(zona.diaSegundoRecordatorio);

        if (!hoylocal.isSame(fechaRecordatorio, 'day')) continue;

        for (const cliente of zona.clientes) {
          try {
            const factura = await this.prisma.facturaInternet.findFirst({
              where: {
                clienteId: cliente.id,
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
                },
                facturacionZonaId: zona.id,
                fechaPagoEsperada: {
                  gte: inicioMesLocal.toDate(),
                  lte: finMesLocal.toDate(),
                },
              },
              select: {
                fechaPagoEsperada: true,
                detalleFactura: true,
                montoPago: true,
              },
            });

            if (!factura) continue;

            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((num) => num.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((num) => num.trim()),
            ].filter((num) => num);

            const dataToTemplate = {
              nombre_cliente: `${cliente.nombre} ${cliente.apellidos}`,
              empresa_nombre: infoEmpresa.nombre,
              fecha_pago: formatearFecha(
                factura.fechaPagoEsperada.toISOString(),
              ),
              monto_pago: factura.montoPago,
              detalle_factura: `Pago por suscripción mensual al servicio de internet, Plan: ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad})`,
            };

            const bodyMensaje = this.renderTemplate(
              bodyTemplate.body,
              dataToTemplate,
            );
            console.log('Mensaje a enviar:', bodyMensaje);

            const numerosValidos = numerosTelefono
              .map((n) => {
                try {
                  return this.formatearNumeroWhatsApp(n);
                } catch (err) {
                  console.warn(`Número descartado: ${n} -> ${err.message}`);
                  return null;
                }
              })
              .filter(Boolean);

            for (const numero of numerosValidos) {
              try {
                // await this.twilioService.sendWhatsApp(numero, bodyMensaje);
                // console.log(`✉️ Mensaje enviado a ${numero}`);
              } catch (error) {
                console.warn(
                  `❌ Error al enviar mensaje a ${numero}:`,
                  error.message,
                );
              }
            }
          } catch (clienteError) {
            console.warn(
              `Error procesando cliente ${cliente.id}:`,
              clienteError,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Error general en CRON primer recordatorio:', error);
    }
  }

  // ENVIAR MENSAJE DIA DE PAGO
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Guatemala',
  })
  async generarMensajeDiaDePago() {
    try {
      const hoylocal = dayjs().tz('America/Guatemala');
      const inicioMesLocal = hoylocal.startOf('month');
      const finMesLocal = hoylocal.endOf('month');

      const infoEmpresa = await this.prisma.empresa.findFirst({
        select: {
          id: true,
          nombre: true,
          telefono: true,
        },
      });

      if (!infoEmpresa) {
        console.warn('Empresa no encontrada. Abortando ejecución.');
        return;
      }

      const bodyTemplate = await this.prisma.plantillaMensaje.findFirst({
        where: {
          tipo: 'AVISO_PAGO',
        },
      });

      if (!bodyTemplate) {
        console.warn('Plantilla AVISO_PAGO no encontrada.');
        return;
      }

      const zonasDeFacturacion = await this.prisma.facturacionZona.findMany({
        select: {
          id: true,
          diaPago: true,
          enviarAvisoPago: true,
          clientes: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              servicioInternet: {
                select: {
                  nombre: true,
                  velocidad: true,
                },
              },
            },
          },
        },
      });

      for (const zona of zonasDeFacturacion) {
        if (!zona.diaPago) continue;
        if (zona.enviarAvisoPago === false) continue;

        const fechaRecordatorio = hoylocal.date(zona.diaPago);

        if (!hoylocal.isSame(fechaRecordatorio, 'day')) continue;

        for (const cliente of zona.clientes) {
          try {
            const factura = await this.prisma.facturaInternet.findFirst({
              where: {
                clienteId: cliente.id,
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
                },
                facturacionZonaId: zona.id,
                fechaPagoEsperada: {
                  gte: inicioMesLocal.toDate(),
                  lte: finMesLocal.toDate(),
                },
              },
              select: {
                fechaPagoEsperada: true,
                detalleFactura: true,
                montoPago: true,
              },
            });

            if (!factura) continue;

            const numerosTelefono = [
              ...(cliente.telefono ?? '').split(',').map((num) => num.trim()),
              ...(cliente.contactoReferenciaTelefono ?? '')
                .split(',')
                .map((num) => num.trim()),
            ].filter((num) => num);

            const dataToTemplate = {
              nombre_cliente: `${cliente.nombre} ${cliente.apellidos}`,
              empresa_nombre: infoEmpresa.nombre,
              fecha_pago: formatearFecha(
                factura.fechaPagoEsperada.toISOString(),
              ),
              monto_pago: factura.montoPago,
              detalle_factura: `Pago por suscripción mensual al servicio de internet, Plan: ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad})`,
            };

            const bodyMensaje = this.renderTemplate(
              bodyTemplate.body,
              dataToTemplate,
            );

            // console.log('Mensaje a enviar:', bodyMensaje);

            const numerosValidos = numerosTelefono
              .map((n) => {
                try {
                  return this.formatearNumeroWhatsApp(n);
                } catch (err) {
                  console.warn(`Número descartado: ${n} -> ${err.message}`);
                  return null;
                }
              })
              .filter(Boolean);

            for (const numero of numerosValidos) {
              try {
                // await this.twilioService.sendWhatsApp(numero, bodyMensaje);
                // console.log(`✉️ Mensaje enviado a ${numero}`);
              } catch (error) {
                console.warn(
                  `❌ Error al enviar mensaje a ${numero}:`,
                  error.message,
                );
              }
            }
          } catch (clienteError) {
            console.warn(
              `Error procesando cliente ${cliente.id}:`,
              clienteError,
            );
          }
        }
      }
    } catch (error) {
      console.error('❌ Error general en CRON primer recordatorio:', error);
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
