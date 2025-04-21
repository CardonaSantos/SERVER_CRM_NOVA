import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacturacionPaymentDto } from './dto/createFacturacionPayment.dto';
import {
  EstadoCliente,
  EstadoFacturaInternet,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';
import * as dayjs from 'dayjs';
import { CreatePaymentOnRuta } from './dto/createPaymentOnRuta.dto';
import { GenerateFactura } from './dto/generateFactura.dto';
import 'dayjs/locale/es'; // Carga el idioma español
import { GenerateFacturaMultipleDto } from './dto/generateMultipleFactura.dto';
import { DeleteFacturaDto } from './dto/delete-one-factura.dto';

import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.locale('es'); // Establece español como idioma predeterminado
const formatearFecha = (fecha: string) => {
  // Formateo en UTC sin conversión a local
  return dayjs(fecha).format('DD/MM/YYYY');
};

type Factura = {
  id: number;
  metodo: string;
  cliente: string;
  cantidad: number;
  fechaCreado: string;
  por: string;
  telefono: number;
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
}

@Injectable()
export class FacturacionService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createFacturacionDto: CreateFacturacionDto) {}

  async findAll() {
    try {
      const facturas = await this.prisma.facturaInternet.findMany({
        select: {
          id: true,
          montoPago: true,
          saldoPendiente: true,
          // metodoPago: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          estadoFacturaInternet: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              direccion: true,
              dpi: true,
              estadoCliente: true,
              servicioInternet: {
                select: {
                  id: true,
                  nombre: true,
                  velocidad: true,
                  precio: true,
                },
              },
              facturacionZona: {
                select: {
                  id: true,
                  nombre: true,
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

          pagos: {
            select: {
              cobrador: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
              montoPagado: true,
              fechaPago: true,
              creadoEn: true,
              metodoPago: true,
              cobradorId: true,
            },
          },
          RecordatorioPago: {
            select: {
              id: true,
              creadoEn: true,
              tipo: true,
            },
          },
        },
      });

      // Mapeamos los resultados para que coincidan con el tipo `FacturaInternet`
      const resultado = facturas.map((fac) => ({
        id: fac.id,
        fechaPagoEsperada: fac.fechaPagoEsperada?.toISOString() || null,
        fechaPagada: null, // Asumimos que aún no ha sido pagada, ajusta según tu lógica
        montoPago: fac.montoPago,
        saldoPendiente: fac.saldoPendiente,
        empresaId: fac.cliente.empresa?.id || 0,
        empresa: {
          id: fac.cliente.empresa?.id || 0,
          nombre: fac.cliente.empresa?.nombre || 'No especificada',
        },
        // metodoPago: fac.metodoPago,
        clienteId: fac.cliente.id,
        cliente: {
          id: fac.cliente.id,
          nombre: fac.cliente.nombre,
          apellidos: fac.cliente.apellidos,
          telefono: fac.cliente.telefono,
          direccion: fac.cliente.direccion || 'No especificada',
          dpi: fac.cliente.dpi || 'No especificado',
          estadoCliente: fac.cliente.estadoCliente,
          servicioInternet: fac.cliente.servicioInternet
            ? {
                id: fac.cliente.servicioInternet.id,
                nombre: fac.cliente.servicioInternet.nombre,
                velocidad:
                  fac.cliente.servicioInternet.velocidad || 'No especificada',
                precio: fac.cliente.servicioInternet.precio,
              }
            : null,
          facturacionZona: fac.cliente.facturacionZona
            ? {
                id: fac.cliente.facturacionZona.id,
                nombre: fac.cliente.facturacionZona.nombre,
              }
            : null,
          empresa: {
            id: fac.cliente.empresa?.id || 0,
            nombre: fac.cliente.empresa?.nombre || 'No especificada',
          },
        },
        estadoFacturaInternet: fac.estadoFacturaInternet,
        pagos: fac.pagos.map((pago) => ({
          cobrador: pago.cobrador.nombre,
          montoPagado: pago.montoPagado,
          metodoPago: pago.metodoPago,
          fechaPago: pago.fechaPago.toISOString(),
          cobradorId: pago.cobradorId,
          creadoEn: pago.creadoEn.toISOString(),
        })),
        creadoEn: fac.creadoEn.toISOString(),
        actualizadoEn: fac.creadoEn?.toISOString() || null,
        nombreClienteFactura: `${fac.cliente.nombre} ${fac.cliente.apellidos}`,
        detalleFactura: `Servicio de Internet ${fac.cliente.servicioInternet?.nombre || 'No asignado'} - ${new Date(fac.fechaPagoEsperada).getMonth() + 1} ${new Date(fac.fechaPagoEsperada).getFullYear()}`,
        facturacionZonaId: fac.cliente.facturacionZona?.id,
        facturacionZona: {
          id: fac.cliente.facturacionZona?.id || 0,
          nombre: fac.cliente.facturacionZona?.nombre || 'No asignada',
        },
        RecordatorioPago: fac.RecordatorioPago.map((recordatorio) => ({
          id: recordatorio.id,
          fechaEnvio: recordatorio.creadoEn.toISOString(),
          medioEnvio: recordatorio.tipo,
        })),
      }));

      return resultado;
    } catch (error) {
      console.log('Error al obtener las facturas:', error);
      throw new Error('No se pudo obtener la información de las facturas.');
    }
  }

  async findOneFacturaWithPayments(id: number) {
    try {
      console.log('El id es: ', id);

      const dataToSelect = {
        id: true,
        montoPago: true,
        saldoPendiente: true,
        // metodoPago: true,
        creadoEn: true,
        fechaPagoEsperada: true,
        estadoFacturaInternet: true,
        detalleFactura: true,
        fechaPagada: true,
        cliente: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            direccion: true,
            dpi: true,
            estadoCliente: true,
            servicioInternet: {
              select: {
                id: true,
                nombre: true,
                velocidad: true,
                precio: true,
              },
            },
            facturacionZona: {
              select: {
                id: true,
                nombre: true,
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

        pagos: {
          select: {
            cobrador: {
              select: {
                id: true,
                nombre: true,
              },
            },
            montoPagado: true,
            fechaPago: true,
            creadoEn: true,
            metodoPago: true,
            cobradorId: true,
          },
        },
        RecordatorioPago: {
          select: {
            id: true,
            creadoEn: true,
            tipo: true,
          },
        },
      };

      const factura = await this.prisma.facturaInternet.findUnique({
        where: {
          id: id,
        },
        select: dataToSelect,
      });

      const otrasFacturasPendientes =
        await this.prisma.facturaInternet.findMany({
          where: {
            clienteId: factura.cliente.id,
            estadoFacturaInternet: {
              in: ['PARCIAL', 'PENDIENTE', 'VENCIDA'],
            },
            id: {
              not: factura.id,
            },
          },
          select: dataToSelect,
        });

      if (!factura) {
        throw new Error('Factura no encontrada');
      }

      // Procesamos la factura para que coincida con la estructura deseada
      const resultado = {
        id: factura.id,
        fechaPagoEsperada: factura.fechaPagoEsperada?.toISOString() || null,
        fechaPagada: factura.fechaPagada, // Asumimos que aún no ha sido pagada, ajusta según tu lógica
        montoPago: factura.montoPago,
        saldoPendiente: factura.saldoPendiente,
        empresaId: factura.cliente.empresa?.id || 0,
        empresa: {
          id: factura.cliente.empresa?.id || 0,
          nombre: factura.cliente.empresa?.nombre || 'No especificada',
        },
        // metodoPago: factura.metodoPago,
        clienteId: factura.cliente.id,
        cliente: {
          id: factura.cliente.id,
          nombre: factura.cliente.nombre,
          apellidos: factura.cliente.apellidos,
          telefono: factura.cliente.telefono,
          direccion: factura.cliente.direccion || 'No especificada',
          dpi: factura.cliente.dpi || 'No especificado',
          estadoCliente: factura.cliente.estadoCliente,
          servicioInternet: factura.cliente.servicioInternet
            ? {
                id: factura.cliente.servicioInternet.id,
                nombre: factura.cliente.servicioInternet.nombre,
                velocidad:
                  factura.cliente.servicioInternet.velocidad ||
                  'No especificada',
                precio: factura.cliente.servicioInternet.precio,
              }
            : null,
          facturacionZona: factura.cliente.facturacionZona
            ? {
                id: factura.cliente.facturacionZona.id,
                nombre: factura.cliente.facturacionZona.nombre,
              }
            : null,
          empresa: {
            id: factura.cliente.empresa?.id || 0,
            nombre: factura.cliente.empresa?.nombre || 'No especificada',
          },
        },
        estadoFacturaInternet: factura.estadoFacturaInternet,
        pagos: factura.pagos.map((pago) => ({
          cobrador: pago.cobrador.nombre,
          montoPagado: pago.montoPagado,
          metodoPago: pago.metodoPago,
          fechaPago: pago.fechaPago.toISOString(),
          cobradorId: pago.cobradorId,
          creadoEn: pago.creadoEn.toISOString(),
        })),
        creadoEn: factura.creadoEn.toISOString(),
        actualizadoEn: factura.creadoEn?.toISOString() || null,
        nombreClienteFactura: `${factura.cliente.nombre} ${factura.cliente.apellidos}`,
        detalleFactura: `${factura.detalleFactura}`,
        facturacionZonaId: factura.cliente.facturacionZona?.id,
        facturacionZona: {
          id: factura.cliente.facturacionZona?.id || 0,
          nombre: factura.cliente.facturacionZona?.nombre || 'No asignada',
        },
        RecordatorioPago: factura.RecordatorioPago.map((recordatorio) => ({
          id: recordatorio.id,
          fechaEnvio: recordatorio.creadoEn.toISOString(),
          medioEnvio: recordatorio.tipo,
        })),
        facturasPendientes: otrasFacturasPendientes
          .sort(
            (a, b) =>
              new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
          )
          .map((factura) => ({
            id: factura.id,
            fechaPagoEsperada: factura.fechaPagoEsperada,
            montoPago: factura.montoPago,
            estadoFacturaInternet: factura.estadoFacturaInternet,
          })),
      };

      return resultado;
    } catch (error) {
      console.log('Error al obtener la factura:', error);
      throw new Error('No se pudo obtener la información de la factura.');
    }
  }
  //REGISTRAR UN PAGO [NO-EN-RUTA] AJUSTAR EL PAGO
  async createNewPaymentFacturacion(
    createFacturacionPaymentDto: CreateFacturacionPaymentDto,
  ) {
    const {
      facturaInternetId,
      clienteId,
      montoPagado,
      metodoPago,
      cobradorId,
      numeroBoleta,
    } = createFacturacionPaymentDto;

    const numeroBoletaReal =
      metodoPago === 'DEPOSITO' && numeroBoleta?.trim() ? numeroBoleta : null;

    return await this.prisma.$transaction(async (tx) => {
      // 1. Crear nuevo pago
      const newPayment = await tx.pagoFacturaInternet.create({
        data: {
          cliente: { connect: { id: clienteId } },
          montoPagado,
          facturaInternet: { connect: { id: facturaInternetId } },
          metodoPago,
          cobrador: {
            connect: { id: cobradorId },
          },
          numeroBoleta: numeroBoletaReal,
        },
      });

      // 2. Actualizar saldo del cliente
      const clienteSaldo = await tx.saldoCliente.findUnique({
        where: { clienteId },
      });

      if (clienteSaldo) {
        const nuevoSaldoPendiente = clienteSaldo.saldoPendiente - montoPagado;
        const saldoPendienteAjustado = Math.max(nuevoSaldoPendiente, 0); // Evita que el saldo pendiente sea negativo

        await tx.saldoCliente.update({
          where: { clienteId },
          data: {
            saldoPendiente: saldoPendienteAjustado,
            totalPagos: clienteSaldo.totalPagos + montoPagado,
            ultimoPago: new Date(),
          },
        });
      }

      // 3. Actualizar la factura de internet
      const factura = await tx.facturaInternet.findUnique({
        where: { id: facturaInternetId },
      });

      if (factura) {
        const saldoPendienteFacturaAjustado = Math.max(
          factura.saldoPendiente - montoPagado,
          0,
        ); // Evita que el saldo pendiente de la factura sea negativo

        await tx.facturaInternet.update({
          where: { id: facturaInternetId },
          data: {
            saldoPendiente: saldoPendienteFacturaAjustado,
            estadoFacturaInternet:
              saldoPendienteFacturaAjustado <= 0
                ? 'PAGADA'
                : saldoPendienteFacturaAjustado < factura.montoPago &&
                    saldoPendienteFacturaAjustado > 0
                  ? 'PARCIAL'
                  : 'PENDIENTE',
          },
        });
      }

      // 4. Calcular el estado del cliente
      const facturasPendientes = await tx.facturaInternet.findMany({
        where: {
          clienteId,
          estadoFacturaInternet: {
            in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
          },
        },
      });

      // Si hay facturas pendientes, el cliente pasa a MOROSO
      const estadoCliente = facturasPendientes.length > 0 ? 'MOROSO' : 'ACTIVO';

      // 5. Actualizar el estado del cliente
      await tx.clienteInternet.update({
        where: { id: clienteId },
        data: {
          estadoCliente: estadoCliente,
        },
      });

      return newPayment;
    });
  }

  //REGISTRAR PAGO EN RUTA
  async createNewPaymentFacturacionForRuta(
    createFacturacionPaymentDto: CreatePaymentOnRuta,
  ) {
    const {
      facturaInternetId,
      clienteId,
      montoPagado,
      metodoPago,
      cobradorId,
      numeroBoleta,
    } = createFacturacionPaymentDto;

    console.log('Datos del pago:', createFacturacionPaymentDto);

    let numeroBoletaReal: string | null = null;

    // Si el método de pago es DEPOSITO, y el número de boleta es no vacío, asignar el número de boleta
    if (
      metodoPago === 'DEPOSITO' &&
      numeroBoleta &&
      numeroBoleta.trim() !== ''
    ) {
      numeroBoletaReal = numeroBoleta;
    }

    try {
      const data = {
        facturaInternetId,
        clienteId,
        montoPagado,
        metodoPago,
        cobradorId,
        numeroBoleta,
      };

      const newPAgo = await this.createNewPaymentFacturacion(data);
      console.log('el pago en la ruta es: ', newPAgo);

      const newFacturacionPayment = await this.prisma.$transaction(
        async (tx) => {
          const rutaUpdated = await tx.ruta.update({
            where: {
              id: createFacturacionPaymentDto.rutaId,
            },
            data: {
              montoCobrado: createFacturacionPaymentDto.montoPagado,
            },
          });

          console.log('La nueva ruta actualizada es: ', rutaUpdated);
        },
        { timeout: 10000 }, // Aumentamos el tiempo de la transacción a 10 segundos
      );

      console.log('Pago registrado:', newFacturacionPayment);
    } catch (error) {
      console.error('Error al crear el pago:', error);
      throw new Error('Error al procesar el pago');
    }
  }

  async findAllFacturasConPago() {
    try {
      const facturasConPagos = await this.prisma.pagoFacturaInternet.findMany({
        // include: {
        //   pagos: true,
        // },
      });
      return facturasConPagos;
    } catch (error) {
      console.log(error);
    }
  }

  async facturacionToTable() {
    try {
      const facturas = await this.prisma.facturaInternet.findMany({
        orderBy: {
          creadoEn: 'desc',
        },
        select: {
          id: true,
          // estadoFacturaInternet: true,
          estadoFacturaInternet: true,
          cliente: {
            select: {
              nombre: true,
              id: true,
              apellidos: true,
              telefono: true,
              sector: true,
              municipio: {
                select: {
                  id: true,
                },
              },
              departamento: {
                select: {
                  id: true,
                },
              },
              IP: {
                select: {
                  direccionIp: true || null,
                },
              },
            },
          },
          montoPago: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          facturacionZonaId: true,
          pagos: {
            select: {
              cobrador: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

      // Mapeamos las facturas para ajustarlas al formato `Factura`
      const facturasMapeadas = facturas.map((factura) => ({
        id: factura.id,
        // metodo: factura.metodoPago,
        estado: factura.estadoFacturaInternet,
        cliente: `${factura.cliente.nombre} ${factura.cliente.apellidos || ''}`,
        clienteObj: {
          nombre: `${factura.cliente.nombre} ${factura.cliente.apellidos || ''}`,
          departamento: factura.cliente.departamento.id,
          municipio: factura.cliente.municipio.id,
          sector: factura.cliente.sector || null,
          sectorId: factura.cliente.sector?.id || null,
        },
        clienteId: factura.cliente.id,
        direccionIp: factura?.cliente?.IP?.direccionIp || 'No disponible',
        cantidad: factura.montoPago || 0,
        fechaCreado: factura.creadoEn.toISOString(),
        fechaPago:
          factura.fechaPagoEsperada?.toISOString() || 'No especificada',
        por:
          factura.pagos.map((pago) => pago.cobrador.nombre).join(', ') ||
          'No especificado',
        telefono: factura.cliente.telefono || 0,
        facturacionZonaId: factura.facturacionZonaId,
      }));

      const cobrados = facturas.filter((fac) => {
        return !['PENDIENTE', 'PARCIAL', 'VENCIDA', 'ANULADA'].includes(
          fac.estadoFacturaInternet,
        );
      });

      const facturados = facturas; //el total de facturas que tenemos actualmente
      const porCobrar = Math.abs(facturados.length - cobrados.length); //la diferencia entre los cobrados y no

      return {
        facturasMapeadas: facturasMapeadas,
        cobrados: cobrados.length,
        facturados: facturados.length,
        porCobrar: porCobrar,
      };
    } catch (error) {
      console.error('Error al obtener las facturas:', error);
      throw new Error('No se pudo obtener las facturas.');
    }
  }

  //GENERAR MANUALMENTE UNA FACTURA DE INTERNET, FUTURA O PASADA
  async generateFacturaInternet(createGenerateFactura: GenerateFactura) {
    console.log('La data es  : ', createGenerateFactura);

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: createGenerateFactura.clienteId,
      },
      select: {
        facturacionZona: {
          select: {
            id: true,
            diaPago: true,
          },
        },
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
    });

    // Asegurarte de que la fecha esté ajustada correctamente a la zona horaria de Guatemala
    const fechaPagoEsperada = dayjs()
      .month(createGenerateFactura.mes - 1)
      .year(createGenerateFactura.anio)
      .date(cliente.facturacionZona.diaPago)
      .tz('America/Guatemala', true) // Esto asegura que la fecha esté en la zona horaria correcta
      .startOf('day')
      .format(); // Esto generará la fecha en formato ISO 8601 (sin zona horaria explícita)

    console.log('Fecha de pago esperada:', fechaPagoEsperada);

    // Establecer la zona horaria de Guatemala al generar la factura
    const dataFactura: DatosFacturaGenerate = {
      datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago}`,
      fechaPagoEsperada: fechaPagoEsperada,

      montoPago: cliente.servicioInternet.precio,
      saldoPendiente: cliente.servicioInternet.precio,
      estadoFacturaInternet: 'PENDIENTE',
      cliente: cliente.id,
      facturacionZona: cliente.facturacionZona.id,
      nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
    };

    const mesNombre = dayjs()
      .month(createGenerateFactura.mes - 1)
      .year(createGenerateFactura.anio)
      .format('MMMM YYYY'); // Obtiene el nombre del mes y el año

    const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${mesNombre}`;

    try {
      // Iniciamos la transacción
      const result = await this.prisma.$transaction(async (prisma) => {
        // Creamos la factura
        const newFacturaInternet = await prisma.facturaInternet.create({
          data: {
            creadoEn: dayjs().format(),
            fechaPagoEsperada: dayjs(dataFactura.fechaPagoEsperada)
              .month(createGenerateFactura.mes - 1)
              .toDate(),
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
            detalleFactura: detalleFactura,
            empresa: {
              connect: {
                id: 1,
              },
            },
          },
        });

        // Actualizamos el estado del cliente
        await prisma.clienteInternet.update({
          where: {
            id: cliente.id,
          },
          data: {
            estadoCliente: 'MOROSO',
            saldoCliente: {
              update: {
                data: {
                  saldoPendiente: {
                    increment: newFacturaInternet.montoPago,
                  },
                },
              },
            },
          },
        });

        return newFacturaInternet;
      });

      // Si la transacción es exitosa, mostramos el resultado
      console.log('La factura creada es: ', result);
    } catch (error) {
      // Si hay un error, lo capturamos y mostramos
      console.error(
        'Error al generar la factura o actualizar el cliente:',
        error,
      );
    }
  }
  //GENERAR MANUALMENTE MULTIPLES FACTURAS
  async generateFacturaMultiple(
    createFacturaMultipleDto: GenerateFacturaMultipleDto,
  ) {
    const { mesInicio, mesFin, anio, clienteId } = createFacturaMultipleDto;
    console.log('La data llegando es: ', mesInicio, mesFin, anio, clienteId);

    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: clienteId,
      },
      select: {
        id: true,
        empresaId: true,
        facturacionZona: {
          select: {
            id: true,
            diaPago: true,
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
      },
    });

    const facturas = [];

    for (let mes = mesInicio; mes <= mesFin; mes++) {
      const fechaPagoEsperada = dayjs()
        .year(anio)
        .month(mes - 1) // Ajustamos el mes para que sea 0-indexed
        .date(cliente.facturacionZona.diaPago)
        .tz('America/Guatemala', true) // Establece la zona horaria de Guatemala
        // .format('YYYY-MM-DD');
        .format(); // Esto generará la fecha en formato ISO 8601 (sin zona horaria explícita)

      const mesNombre = dayjs()
        .month(mes - 1)
        .year(anio)
        .format('MMMM YYYY'); // Obtiene el nombre del mes y el año

      const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${mesNombre}`;
      //nuevo ajuste
      const nuevaFactura = await this.prisma.facturaInternet.create({
        data: {
          fechaPagoEsperada: fechaPagoEsperada,
          montoPago: cliente.servicioInternet.precio,
          saldoPendiente: cliente.servicioInternet.precio,
          estadoFacturaInternet: 'PENDIENTE',
          clienteId: clienteId,
          facturacionZonaId: cliente.facturacionZona.id,
          detalleFactura: detalleFactura,
          empresaId: cliente.empresaId,
        },
      });

      facturas.push(nuevaFactura);
    }

    const newSaldo = await this.prisma.clienteInternet.update({
      where: {
        id: cliente.id,
      },
      data: {
        estadoCliente: 'MOROSO',
        saldoCliente: {
          update: {
            saldoPendiente: {
              increment: facturas.reduce(
                (acc, factura) => acc + factura.montoPago,
                0,
              ),
            },
          },
        },
      },
    });

    console.log('el nuevo saldo es: ', newSaldo);

    return facturas;
  }
  //DESCONOCIDO??
  async generarFacturasInternet(clienteId: number) {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: {
        id: clienteId,
      },

      select: {
        facturacionZona: {
          select: {
            id: true,
            diaPago: true,
          },
        },
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
    });

    const dataFactura: DatosFacturaGenerate = {
      datalleFactura: `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago}`,
      fechaPagoEsperada: dayjs()
        .date(cliente.facturacionZona.diaPago) // Establece el día de la fecha
        .month(dayjs().month()) // Establece el mes actual
        .year(dayjs().year()) // Establece el año actual
        .isBefore(dayjs(), 'day') // Si la fecha es antes de hoy, pasa al siguiente mes
        ? dayjs().add(1, 'month').date(cliente.facturacionZona.diaPago).format() // Si es antes, agregamos un mes
        : dayjs().date(cliente.facturacionZona.diaPago).format(), // Si no es antes, usa el mes actual
      montoPago: cliente.servicioInternet.precio,
      saldoPendiente: cliente.servicioInternet.precio,
      estadoFacturaInternet: 'PENDIENTE',
      cliente: cliente.id,
      facturacionZona: cliente.facturacionZona.id,
      nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
    };
    console.log('La data para generar la factura es: ', dataFactura);
    const mesNombre = dayjs().format('MMMM YYYY'); // Obtiene el mes y el año de la fecha actual

    const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${mesNombre}`;

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
        detalleFactura: detalleFactura,
        empresa: {
          connect: {
            id: 1,
          },
        },
      },
    });
    const x = await this.prisma.facturaInternet.findUnique({
      where: {
        id: newFacturaInternet.id,
      },
      include: {
        pagos: true,
        RecordatorioPago: true,
      },
    });

    console.log('La factura creada es: ', x);
  }

  findOne(id: number) {
    return `This action returns a #${id} facturacion`;
  }

  update(id: number, updateFacturacionDto: UpdateFacturacionDto) {
    return `This action updates a #${id} facturacion`;
  }

  async remove() {
    try {
      const facturasToDelete = await this.prisma.facturaInternet.deleteMany({});
      return facturasToDelete;
    } catch (error) {
      console.log(error);
    }
  }

  async getFacturaToPDf(id: number) {
    try {
      const facturaPagada = await this.prisma.facturaInternet.findUnique({
        where: {
          id: id,
        },
        select: {
          id: true,
          estadoFacturaInternet: true,
          montoPago: true,
          detalleFactura: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          nombreClienteFactura: true,
          saldoPendiente: true,

          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dpi: true,
            },
          },
          empresa: {
            select: {
              id: true,
              nombre: true,
              direccion: true,
              correo: true,
              pbx: true,
              sitioWeb: true,
              telefono: true,
              nit: true,
            },
          },
          pagos: {
            select: {
              id: true,
              metodoPago: true,
              fechaPago: true,
              montoPagado: true,
              creadoEn: true,
              numeroBoleta: true,
            },
          },
        },
      });

      const pagos = facturaPagada.pagos.map((pago) => ({
        id: pago.id,
        metodoPago: pago.metodoPago,
        montoPagado: pago.montoPagado,
        fechaPago: pago.fechaPago.toISOString(),
        creadoEn: pago.creadoEn.toISOString(),
        numeroBoleta: pago.numeroBoleta,
      }));

      const totalPagados = pagos.reduce(
        (total, pago) => total + pago.montoPagado,
        0,
      );
      const saldoPendiente = facturaPagada.montoPago - totalPagados;

      // Estructurar la data de la factura
      const facturaData = {
        id: facturaPagada.id,
        estadoFacturaInternet: facturaPagada.estadoFacturaInternet,
        montoPago: facturaPagada.montoPago,
        detalleFactura: facturaPagada.detalleFactura,
        creadoEn: facturaPagada.creadoEn.toISOString(),
        fechaPagoEsperada: facturaPagada.fechaPagoEsperada?.toISOString(),
        saldoPendiente,
        cliente: {
          id: facturaPagada.cliente.id,
          nombre: facturaPagada.cliente.nombre,
          apellidos: facturaPagada.cliente.apellidos,
          dpi: facturaPagada.cliente.dpi,
        },
        empresa: {
          id: facturaPagada.empresa.id,
          nombre: facturaPagada.empresa.nombre,
          direccion: facturaPagada.empresa.direccion,
          correo: facturaPagada.empresa.correo,
          pbx: facturaPagada.empresa.pbx,
          sitioWeb: facturaPagada.empresa.sitioWeb,
          telefono: facturaPagada.empresa.telefono,
          nit: facturaPagada.empresa.nit,
        },
        pagos,
      };
      return facturaData;
    } catch (error) {
      console.log(error);
    }
  }

  async removeOneFactura(dto: DeleteFacturaDto) {
    const { facturaId, estadoFactura, fechaEmision, fechaVencimiento } = dto;

    // 1. Buscar la factura a eliminar junto con los pagos asociados
    const facturaToDelete = await this.prisma.facturaInternet.findUnique({
      where: { id: facturaId },
      include: { pagos: true }, // Incluir los pagos asociados a la factura
    });

    if (!facturaToDelete) {
      throw new NotFoundException('Factura no encontrada');
    }

    // 2. Calcular el monto total de los pagos asociados a la factura eliminada
    const pagosAsociados = facturaToDelete.pagos;
    let montoTotalPagos = 0;
    for (const pago of pagosAsociados) {
      montoTotalPagos += pago.montoPagado;
    }

    // 3. Eliminar la factura
    await this.prisma.facturaInternet.delete({
      where: { id: facturaToDelete.id },
    });

    // 4. Obtener el saldo del cliente
    const saldoCliente = await this.prisma.saldoCliente.findUnique({
      where: { clienteId: facturaToDelete.clienteId },
    });

    if (saldoCliente) {
      // 5. Recalcular el saldo pendiente real del cliente después de eliminar la factura
      // Obtener todas las facturas pendientes restantes (sin la eliminada)
      const facturasRestantes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId: facturaToDelete.clienteId,
          estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
        },
      });

      // Calcular el nuevo saldo pendiente sumando los montos de las facturas restantes
      let nuevoSaldoPendiente = 0;
      for (const factura of facturasRestantes) {
        nuevoSaldoPendiente += factura.montoPago;
      }

      // 6. Ajustar el saldo pendiente después de eliminar la factura y restar los pagos asociados
      const saldoPendienteAjustado = Math.max(nuevoSaldoPendiente, 0); // Evitar que el saldo pendiente sea negativo

      // Si el pago realizado es mayor que la factura eliminada, se genera un saldo a favor
      const saldoFavor = Math.max(
        saldoCliente.saldoFavor + (montoTotalPagos - facturaToDelete.montoPago),
        0,
      );

      // 7. Actualizar el saldo del cliente
      await this.prisma.saldoCliente.update({
        where: { clienteId: facturaToDelete.clienteId },
        data: {
          saldoPendiente: saldoPendienteAjustado,
          saldoFavor: saldoFavor, // Actualizar saldo a favor
          totalPagos: saldoCliente.totalPagos - montoTotalPagos, // Restamos los pagos asociados
        },
      });
    }

    // 8. Recalcular el estado del cliente
    const facturasPendientes = await this.prisma.facturaInternet.findMany({
      where: {
        clienteId: facturaToDelete.clienteId,
        estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
      },
    });

    // Si hay facturas pendientes, el cliente pasa a MOROSO
    const estadoCliente = facturasPendientes.length > 0 ? 'MOROSO' : 'ACTIVO';

    // 9. Actualizar el estado del cliente
    await this.prisma.clienteInternet.update({
      where: { id: facturaToDelete.clienteId },
      data: { estadoCliente: estadoCliente },
    });

    console.log(
      `Factura ${facturaId} eliminada y estado de cliente actualizado.`,
    );

    return `Factura ${facturaId} eliminada y estado de cliente actualizado.`;
  }

  async removeManyFacturasMarch() {
    console.log('Entrando al service de facturas marzo');

    // 1. Define date boundaries for March.
    // Note: In JavaScript Date, months are 0-indexed (0 = January, so 2 = March).
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 2, 1); // March 1st
    // For the end date, get the last moment of March.
    const endDate = new Date(currentYear, 3, 0, 23, 59, 59, 999); // March 31st

    // 2. Retrieve all facturas in March with their associated pagos.
    const facturasToDelete = await this.prisma.facturaInternet.findMany({
      where: {
        creadoEn: { gte: startDate, lte: endDate },
      },
      include: { pagos: true },
    });

    if (!facturasToDelete.length) {
      throw new NotFoundException('No facturas found for March');
    }

    // 3. Group facturas by clienteId and compute totals.
    const clienteAdjustments = new Map<
      number,
      { totalDeletedPagos: number; totalDeletedMontoPago: number }
    >();

    for (const factura of facturasToDelete) {
      const clienteId = factura.clienteId;
      let montoTotalPagosForFactura = 0;
      for (const pago of factura.pagos) {
        montoTotalPagosForFactura += pago.montoPagado;
      }
      if (!clienteAdjustments.has(clienteId)) {
        clienteAdjustments.set(clienteId, {
          totalDeletedPagos: 0,
          totalDeletedMontoPago: 0,
        });
      }
      const adjustment = clienteAdjustments.get(clienteId);
      adjustment.totalDeletedPagos += montoTotalPagosForFactura;
      adjustment.totalDeletedMontoPago += factura.montoPago;
    }

    // 4. Delete all matching facturas (those issued in March) using deleteMany.
    const deleteResult = await this.prisma.facturaInternet.deleteMany({
      where: {
        creadoEn: { gte: startDate, lte: endDate },
      },
    });

    // 5. For each affected cliente, update their balance.
    // Iterate over each cliente that had at least one factura deleted.
    for (const [clienteId, adjustment] of clienteAdjustments.entries()) {
      // Recalculate the new total pending balance based on the remaining pending facturas.
      const facturasRestantes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId: clienteId,
          estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
        },
      });

      let nuevoSaldoPendiente = 0;
      for (const factura of facturasRestantes) {
        nuevoSaldoPendiente += factura.montoPago;
      }

      // Get the current balance record of the client.
      const saldoCliente = await this.prisma.saldoCliente.findUnique({
        where: { clienteId },
      });

      if (saldoCliente) {
        // Adjust the pending balance (making sure it doesn't become negative).
        const saldoPendienteAjustado = Math.max(nuevoSaldoPendiente, 0);
        // Compute new 'saldoFavor' in case the payments deleted exceeded the invoice amount.
        const nuevoSaldoFavor = Math.max(
          saldoCliente.saldoFavor +
            (adjustment.totalDeletedPagos - adjustment.totalDeletedMontoPago),
          0,
        );
        // Update total payments (subtracting the deleted payments).
        const updatedTotalPagos =
          saldoCliente.totalPagos - adjustment.totalDeletedPagos;

        await this.prisma.saldoCliente.update({
          where: { clienteId },
          data: {
            saldoPendiente: saldoPendienteAjustado,
            saldoFavor: nuevoSaldoFavor,
            totalPagos: updatedTotalPagos,
          },
        });
      }

      // 6. Recalculate the estadoCliente based on any remaining pending facturas.
      const facturasPendientes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId,
          estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
        },
      });
      const estadoCliente = facturasPendientes.length > 0 ? 'MOROSO' : 'ACTIVO';

      await this.prisma.clienteInternet.update({
        where: { id: clienteId },
        data: { estadoCliente },
      });
    }

    console.log(
      `
      Deleted ${deleteResult.count} facturas from March and updated cliente balances.,
      `,
    );
    return `Deleted ${deleteResult.count} facturas from March and updated cliente balances`;
  }
}
