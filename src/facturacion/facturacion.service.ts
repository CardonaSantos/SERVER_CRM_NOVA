import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateFacturacionDto } from './dto/create-facturacion.dto';
import { UpdateFacturacionDto } from './dto/update-facturacion.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFacturacionPaymentDto } from './dto/createFacturacionPayment.dto';
import {
  EstadoCliente,
  EstadoFactura,
  EstadoFacturaInternet,
  PagoFacturaInternet,
  Prisma,
  StateFacturaInternet,
} from '@prisma/client';
import * as dayjs from 'dayjs';
import { CreatePaymentOnRuta } from './dto/createPaymentOnRuta.dto';
import { GenerateFactura } from './dto/generateFactura.dto';
import 'dayjs/locale/es'; // Carga el idioma español
import { GenerateFacturaMultipleDto } from './dto/generateMultipleFactura.dto';
import { DeleteFacturaDto } from './dto/delete-one-factura.dto';
import {
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { log } from 'console';
import { UpdateFacturaDto } from './dto/update-factura.dto';
import { periodoFrom } from './Utils';
import { FacturaEliminacionService } from 'src/factura-eliminacion/factura-eliminacion.service';
import { RegistrarPagoFromBanruralDto } from './dto/pago-from-banrural.dto';
import { calculateEstadoCliente } from './functions/functions';

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
  private readonly logger = new Logger(FacturacionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly facturaEliminiacion: FacturaEliminacionService,
  ) {}
  async create(createFacturacionDto: CreateFacturacionDto) {}

  async findAll() {
    try {
      const facturas = await this.prisma.facturaInternet.findMany({
        select: {
          id: true,
          montoPago: true,
          saldoPendiente: true,
          fechaPagada: true,
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
        fechaPagada: fac.fechaPagada, // Asumimos que aún no ha sido pagada, ajusta según tu lógica
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
  async finAllRelaciones() {
    try {
      const find = await this.prisma.facturaInternet.findMany({
        orderBy: {
          creadoEn: 'desc',
        },
        include: {
          serviciosAdicionales: {
            include: {
              servicios: {
                include: {
                  servicio: true,
                },
              },
            },
          },
        },
      });
      return find.slice(0, 5);
    } catch (error) {}
  }

  /**
   *
   * @param id Solicita el id de la factura
   * @returns Retorna la factura del cliente, con otros datos para su pago
   */
  async findOneFacturaWithPayments(id: number) {
    try {
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
        creador: {
          select: {
            id: true,
            nombre: true,
            rol: true,
          },
        },
        pagos: {
          select: {
            cobrador: {
              select: {
                id: true,
                nombre: true,
                rol: true,
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
        creador: factura.creador
          ? {
              id: factura.creador.id,
              nombre: factura.creador.nombre,
              rol: factura.creador.rol,
            }
          : null,
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
          cobrador: pago.cobrador
            ? {
                id: pago.cobrador.id,
                nombre: pago.cobrador.nombre,
                rol: pago.cobrador.rol,
              }
            : null,
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
      serviciosAdicionales,
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
            fechaPagada: new Date(),
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

      // 5. Actualizar el estado del cliente
      await tx.clienteInternet.update({
        where: { id: clienteId },
        data: {
          estadoCliente: estadoCliente,
        },
      });

      await Promise.all(
        (serviciosAdicionales ?? []).map(async (servicioId) => {
          const svc = await tx.servicio.findUnique({
            where: { id: servicioId },
          });
          if (!svc) throw new Error(`Servicio ${servicioId} no existe`);

          // 5.1 Crear factura genérica (“item”)
          const facturaServicio = await tx.factura.create({
            data: {
              empresa: { connect: { id: factura.empresaId } },
              cliente: { connect: { id: clienteId } },
              tipoFactura: 'SERVICIO_ADICIONAL',
              montoTotal: svc.precio,
              saldoPendiente: svc.precio,
              estado: 'PENDIENTE',
              facturaInternet: { connect: { id: facturaInternetId } },

              servicios: {
                create: [
                  {
                    servicioId: svc.id,
                    precioUnitario: svc.precio,
                    total: svc.precio,
                  },
                ],
              },
            },
          });

          console.log(
            'La factura del servicio adicional es: ',
            facturaServicio,
          );

          // 5.2 Registrar pago de ese ítem
          const pago = await tx.pagoFactura.create({
            data: {
              metodoPago: 'EFECTIVO',
              montoPagado: facturaServicio.montoTotal,
              cliente: { connect: { id: clienteId } },
              factura: { connect: { id: facturaServicio.id } },
            },
          });

          console.log('El pago del servicio es: ', pago);
        }),
      );

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
      rutaId,
      observaciones,
    } = createFacturacionPaymentDto;

    try {
      const newPago = await this.createNewPaymentFacturacion({
        facturaInternetId,
        clienteId,
        montoPagado,
        metodoPago,
        cobradorId,
        numeroBoleta,
      });

      const result = await this.prisma.$transaction(async (tx) => {
        const ruta = await tx.ruta.findUnique({
          where: { id: rutaId },
          select: { montoCobrado: true },
        });

        if (!ruta) {
          throw new Error(`Ruta con id ${rutaId} no encontrada`);
        }

        await tx.ruta.update({
          where: { id: rutaId },
          data: {
            montoCobrado: ruta.montoCobrado + montoPagado,
          },
        });
      });

      return result;
    } catch (error) {
      console.error('Error al registrar pago en ruta:', error);
      throw new Error('Error al registrar el pago en la ruta');
    }
  }

  async findAllFacturasConPago() {
    try {
      const facturasConPagos = await this.prisma.pagoFacturaInternet.findMany(
        {},
      );
      return facturasConPagos;
    } catch (error) {
      console.log(error);
    }
  }

  async facturacionToTable(
    page: number = 1,
    limit = 10,
    paramSearch?: string,

    zona?: number,
    municipio?: number,
    departamento?: number,
    sector?: number,

    estadoFactura?: StateFacturaInternet,
  ) {
    try {
      const skip = (page - 1) * limit;
      // 1) Tokenizamos el search en términos
      const terms =
        paramSearch
          ?.trim()
          .split(/\s+/)
          .filter((t) => t.length > 0) || [];

      // 2) Construimos dinámicamente las condiciones AND
      const andConditions: Prisma.FacturaInternetWhereInput[] = [];

      // 2.1) Para cada término, buscamos en nombre o apellidos
      for (const term of terms) {
        andConditions.push({
          OR: [
            { cliente: { nombre: { contains: term, mode: 'insensitive' } } },
            { cliente: { apellidos: { contains: term, mode: 'insensitive' } } },
            { cliente: { telefono: { contains: term, mode: 'insensitive' } } },
            {
              cliente: {
                IP: { direccionIp: { contains: term, mode: 'insensitive' } },
              },
            },
          ],
        });
      }

      // 2.2) Filtros extras
      if (zona) andConditions.push({ facturacionZonaId: zona });
      if (municipio)
        andConditions.push({ cliente: { municipioId: municipio } });
      if (departamento)
        andConditions.push({ cliente: { departamentoId: departamento } });
      if (sector) andConditions.push({ cliente: { sectorId: sector } });
      // Filtrar por estado (incluye valor 0)
      if (
        estadoFactura !== undefined &&
        estadoFactura !== null &&
        estadoFactura != ('TODOS' as StateFacturaInternet)
      ) {
        andConditions.push({
          estadoFacturaInternet: { equals: estadoFactura },
        });
      }

      // 3) Armamos el where final
      const whereCondition: Prisma.FacturaInternetWhereInput =
        andConditions.length > 0 ? { AND: andConditions } : {};

      this.logger.debug(
        'whereCondition:',
        JSON.stringify(whereCondition, null, 2),
      );

      const [facturas, totalCount] = await this.prisma.$transaction([
        this.prisma.facturaInternet.findMany({
          skip: skip,
          take: limit,
          orderBy: {
            creadoEn: 'desc',
          },
          where: whereCondition,

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
        }),
        this.prisma.facturaInternet.count({ where: whereCondition }),
      ]);

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
          factura.pagos
            .map((pago) => pago.cobrador?.nombre)
            .filter(Boolean)
            .join(', ') || 'No especificado',

        telefono: factura.cliente.telefono || 0,
        facturacionZonaId: factura.facturacionZonaId,
      }));

      // const cobrados = facturas.filter((fac) => {
      //   return !['PENDIENTE', 'PARCIAL', 'VENCIDA', 'ANULADA'].includes(
      //     fac.estadoFacturaInternet,
      //   );
      // });

      const [cobrados, facturados] = await this.prisma.$transaction([
        this.prisma.facturaInternet.count({
          where: {
            estadoFacturaInternet: {
              notIn: ['PENDIENTE', 'PARCIAL', 'VENCIDA', 'ANULADA'],
            },
          },
        }),
        this.prisma.facturaInternet.count(),
      ]);

      // const facturados = facturas; //el total de facturas que tenemos actualmente
      const porCobrar = Math.abs(facturados - cobrados); //la diferencia entre los cobrados y no

      return {
        facturasMapeadas: facturasMapeadas,
        totalCount: totalCount,
        cobrados: cobrados,
        facturados: facturados,
        porCobrar: porCobrar,
      };
    } catch (error) {
      console.error('Error al obtener las facturas:', error);
      throw new Error('No se pudo obtener las facturas.');
    }
  }

  async find_factura_to_edit(facturaId: number) {
    try {
      const factura = await this.prisma.facturaInternet.findUnique({
        where: {
          id: facturaId,
        },

        select: {
          id: true,
          montoPago: true,
          saldoPendiente: true,
          fechaPagada: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          estadoFacturaInternet: true,
          detalleFactura: true,
          actualizadoEn: true,
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              estadoCliente: true,
            },
          },
        },
      });

      if (!factura) {
        throw new NotFoundException('Factura no encontrada');
      }
      console.log('La factura es: ', factura);
      return factura;
    } catch (error) {
      console.log(error);
    }
  }

  /**
   *
   * @param createGenerateFactura
   * @returns Una factura generada manualmente
   */
  async generateFacturaInternet(createGenerateFactura: GenerateFactura) {
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

    const fechaPago = dayjs()
      .month(createGenerateFactura.mes - 1)
      .year(createGenerateFactura.anio)
      .date(cliente.facturacionZona.diaPago);

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
    const mesNombre = fechaPago.format('MMMM YYYY').toUpperCase();
    const monto = cliente.servicioInternet.precio.toFixed(2);
    const detalleSimple = `Factura correspondiente a ${mesNombre} por Q${monto} | ${cliente.servicioInternet.nombre}`;

    const periodo = periodoFrom(dataFactura.fechaPagoEsperada);

    try {
      const result = await this.prisma.$transaction(async (prisma) => {
        const newFacturaInternet = await prisma.facturaInternet.create({
          data: {
            periodo: periodo,
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
            creador: createGenerateFactura.creadorId
              ? {
                  connect: {
                    id: createGenerateFactura.creadorId,
                  },
                }
              : undefined,

            facturacionZona: {
              connect: { id: dataFactura.facturacionZona },
            },
            nombreClienteFactura: dataFactura.nombreClienteFactura,
            detalleFactura: detalleSimple,
            empresa: {
              connect: {
                id: 1,
              },
            },
          },
        });

        // Actualizamos el estado del cliente

        const facturas = await prisma.facturaInternet.findMany({
          where: {
            clienteId: cliente.id,
            estadoFacturaInternet: {
              in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
            },
          },
        });

        const facturasPendientes = facturas.length;

        let estadoCliente: EstadoCliente;

        switch (facturasPendientes) {
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

        await prisma.clienteInternet.update({
          where: {
            id: cliente.id,
          },
          data: {
            estadoCliente: estadoCliente,
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
      this.logger.debug('La factura creada es: ', result);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException({
          message:
            'Ya existe una factura para ese mes. No se permiten duplicados',
        });
      }
      //  Cualquier otro error se propaga
      throw err;
    }
  }

  //**
  // Generar facturas multiples manualmente
  // */
  async generateFacturaMultiple(
    createFacturaMultipleDto: GenerateFacturaMultipleDto,
  ) {
    try {
      const { mesInicio, mesFin, anio, clienteId } = createFacturaMultipleDto;
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
          .month(mes - 1)
          .date(cliente.facturacionZona.diaPago)
          .tz('America/Guatemala', true)
          .format();

        const mesNombre = dayjs()
          .month(mes - 1)
          .year(anio)
          .format('MMMM YYYY')
          .toUpperCase();

        const periodo = periodoFrom(fechaPagoEsperada);
        const monto = cliente.servicioInternet.precio.toFixed(2);
        const detalleSimple = `Factura correspondiente a ${mesNombre} por Q${monto} | ${cliente.servicioInternet.nombre}`;

        const nuevaFactura = await this.prisma.facturaInternet.create({
          data: {
            periodo: periodo,
            fechaPagoEsperada: fechaPagoEsperada,
            montoPago: cliente.servicioInternet.precio,
            saldoPendiente: cliente.servicioInternet.precio,
            estadoFacturaInternet: 'PENDIENTE',
            detalleFactura: detalleSimple,
            cliente: {
              connect: { id: clienteId },
            },
            facturacionZona: {
              connect: { id: cliente.facturacionZona.id },
            },
            empresa: {
              connect: { id: cliente.empresaId },
            },
            creador: createFacturaMultipleDto.creadorId
              ? {
                  connect: {
                    id: createFacturaMultipleDto.creadorId,
                  },
                }
              : undefined,
          },
        });

        this.logger.debug('La factura generada es: ', nuevaFactura);

        facturas.push(nuevaFactura);
      }

      const facturasPendientes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId,
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

      const newSaldo = await this.prisma.clienteInternet.update({
        where: {
          id: cliente.id,
        },
        data: {
          estadoCliente: estadoCliente,
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
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        // Opcional: consultar la factura existente y devolverla

        throw new ConflictException({
          message: 'Se detectó una factura duplicada',
        });
      }
      //  Cualquier otro error se propaga
      throw err;
    }
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
    const periodo = periodoFrom(dataFactura.fechaPagoEsperada); // o la fecha que uses
    console.log('El periodo generando es: ', periodo);
    const newFacturaInternet = await this.prisma.facturaInternet.create({
      data: {
        periodo: periodo,
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

  async updateFactura(id: number, dto: UpdateFacturaDto) {
    try {
      console.log('actualizando la factura', dto);

      const facturaToUpdate = await this.prisma.facturaInternet.findUnique({
        where: { id },
      });
      if (!facturaToUpdate)
        throw new NotFoundException('Factura no encontrada');

      const saldoOriginalFactura = facturaToUpdate.saldoPendiente;

      const nuevoSaldoFactura = dto.montoPago;

      const facturaUpdated = await this.prisma.facturaInternet.update({
        where: { id },
        data: {
          montoPago: dto.montoPago,
          saldoPendiente: nuevoSaldoFactura,
          detalleFactura: dto.detalleFactura,
          fechaPagada: dto.fechaPagada ? new Date(dto.fechaPagada) : null,
          fechaPagoEsperada: dto.fechaPagoEsperada
            ? new Date(dto.fechaPagoEsperada)
            : null,
          estadoFacturaInternet:
            dto.estadoFacturaInternet as StateFacturaInternet,
        },
      });

      const clienteSaldo = await this.prisma.saldoCliente.findUnique({
        where: { clienteId: facturaToUpdate.clienteId },
      });
      //Actualizar solo una vez
      if (clienteSaldo) {
        if (dto.estadoFacturaInternet === 'ANULADA') {
          const nuevoSaldoPendiente = Math.max(
            clienteSaldo.saldoPendiente - saldoOriginalFactura,
            0,
          );
          await this.prisma.saldoCliente.update({
            where: { clienteId: clienteSaldo.clienteId },
            data: { saldoPendiente: nuevoSaldoPendiente },
          });
        } else {
          const diferencia = saldoOriginalFactura - nuevoSaldoFactura;
          const saldoClienteAjustado = Math.max(
            clienteSaldo.saldoPendiente - diferencia,
            0,
          );

          await this.prisma.saldoCliente.update({
            where: { clienteId: clienteSaldo.clienteId },
            data: { saldoPendiente: saldoClienteAjustado },
          });
        }
      }

      const facturasPendientes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId: facturaToUpdate.clienteId,
          estadoFacturaInternet: {
            in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'],
          },
        },
      });

      console.log('Las facturas pendientes son: ', facturasPendientes);

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
          if (facturasPendientes.length > 3) {
            estadoCliente = 'MOROSO';
          }
          break;
      }

      await this.prisma.clienteInternet.update({
        where: {
          id: facturaToUpdate.clienteId,
        },
        data: {
          estadoCliente: estadoCliente,
        },
      });

      return facturaUpdated;
    } catch (error) {
      console.log(error);
    }
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
          //añadir la factura pagada
          // …tu selección actual…
          serviciosAdicionales: {
            select: {
              id: true,
              montoTotal: true,
              tipoFactura: true,
              saldoPendiente: true,
              fechaEmision: true,
              estado: true,
              servicios: {
                select: {
                  servicio: {
                    select: {
                      id: true,
                      nombre: true,
                      descripcion: true,
                      precio: true,
                    },
                  },
                },
              },
              pagos: {
                select: {
                  id: true,
                  montoPagado: true,
                },
              },
            },
          },

          id: true,
          estadoFacturaInternet: true,
          montoPago: true,
          detalleFactura: true,
          creadoEn: true,
          fechaPagoEsperada: true,
          nombreClienteFactura: true,
          saldoPendiente: true,
          periodo: true,
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

      // Esto da un array plano con solo el nombre y monto
      const servicios = facturaPagada.serviciosAdicionales.flatMap((sa) =>
        sa.servicios.map((item) => ({
          facturaId: sa.id,
          nombre: item.servicio.nombre,
          monto: sa.montoTotal,
          pagado: sa.pagos.reduce((suma, pago) => suma + pago.montoPagado, 0),
          fecha: sa.fechaEmision,
          estado: sa.estado,
        })),
      );

      console.log('Los servicios adicionales con sus nombres son: ', servicios);

      // Estructurar la data de la factura
      const facturaData = {
        id: facturaPagada.id,
        estadoFacturaInternet: facturaPagada.estadoFacturaInternet,
        montoPago: facturaPagada.montoPago,
        detalleFactura: facturaPagada.detalleFactura,
        creadoEn: facturaPagada.creadoEn.toISOString(),
        fechaPagoEsperada: facturaPagada.fechaPagoEsperada?.toISOString(),
        saldoPendiente,
        periodo: facturaPagada.periodo,
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
        servicios,
      };
      return facturaData;
    } catch (error) {
      console.log(error);
    }
  }

  async removeOneFactura(dto: DeleteFacturaDto) {
    console.log('Entrando a eliminacion');

    const { facturaId, userId, motivo } = dto;

    const facturaToDelete = await this.prisma.facturaInternet.findUnique({
      where: { id: facturaId },
      include: { pagos: true },
    });

    if (!facturaToDelete) {
      throw new NotFoundException('Factura no encontrada');
    }

    await this.facturaEliminiacion.createEliminacionFacturaRegist(
      facturaToDelete,
      userId,
      motivo,
      facturaId,
    );

    const pagosAsociados = facturaToDelete.pagos;
    let montoTotalPagos = 0;
    for (const pago of pagosAsociados) {
      montoTotalPagos += pago.montoPagado;
    }

    await this.prisma.facturaInternet.delete({
      where: { id: facturaToDelete.id },
    });

    const saldoCliente = await this.prisma.saldoCliente.findUnique({
      where: { clienteId: facturaToDelete.clienteId },
    });

    if (saldoCliente) {
      const facturasRestantes = await this.prisma.facturaInternet.findMany({
        where: {
          clienteId: facturaToDelete.clienteId,
          estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
        },
      });

      let nuevoSaldoPendiente = 0;
      for (const factura of facturasRestantes) {
        nuevoSaldoPendiente += factura.montoPago;
      }

      const saldoPendienteAjustado = Math.max(nuevoSaldoPendiente, 0);

      const saldoFavor = Math.max(
        saldoCliente.saldoFavor + (montoTotalPagos - facturaToDelete.montoPago),
        0,
      );

      await this.prisma.saldoCliente.update({
        where: { clienteId: facturaToDelete.clienteId },
        data: {
          saldoPendiente: saldoPendienteAjustado,
          saldoFavor: saldoFavor, // Actualizar saldo a favor
          totalPagos: saldoCliente.totalPagos - montoTotalPagos, // Restamos los pagos asociados
        },
      });
    }

    const facturasPendientes = await this.prisma.facturaInternet.findMany({
      where: {
        clienteId: facturaToDelete.clienteId,
        estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
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

    await this.prisma.clienteInternet.update({
      where: { id: facturaToDelete.clienteId },
      data: { estadoCliente: estadoCliente },
    });

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

  /**
   *
   * @param createFacturacionPaymentDto Dto personalizado para pago desde banrural
   * @returns
   */
  async generatePagoFromBanrural(
    createFacturacionPaymentDto: RegistrarPagoFromBanruralDto,
    UUID: string,
  ): Promise<PagoFacturaInternet> {
    const { clienteId, facturaId, descripcion, moneda, monto } =
      createFacturacionPaymentDto;

    this.logger.debug('Mi UUID de este pago es: ', UUID);

    return await this.prisma.$transaction(async (tx) => {
      const newPayment = await tx.pagoFacturaInternet.create({
        data: {
          cliente: { connect: { id: clienteId } },
          montoPagado: monto,
          facturaInternet: { connect: { id: facturaId } },
          metodoPago: 'DEPOSITO',
        },
      });

      const clienteSaldo = await tx.saldoCliente.findUnique({
        where: { clienteId },
      });

      if (clienteSaldo) {
        const nuevoSaldoPendiente = clienteSaldo.saldoPendiente - monto;
        const saldoPendienteAjustado = Math.max(nuevoSaldoPendiente, 0);

        await tx.saldoCliente.update({
          where: { clienteId },
          data: {
            saldoPendiente: saldoPendienteAjustado,
            totalPagos: clienteSaldo.totalPagos + monto,
            ultimoPago: new Date(),
          },
        });
      }

      const factura = await tx.facturaInternet.findUnique({
        where: { id: facturaId },
      });

      if (factura) {
        const saldoPendienteFacturaAjustado = Math.max(
          factura.saldoPendiente - monto,
          0,
        );

        await tx.facturaInternet.update({
          where: { id: facturaId },
          data: {
            fechaPagada: new Date(),
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

      const facturasPendientesCantidad = await tx.facturaInternet.count({
        where: {
          clienteId,
          estadoFacturaInternet: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDA'] },
        },
      });

      let estadoCliente: EstadoCliente;
      estadoCliente = calculateEstadoCliente(facturasPendientesCantidad);

      await tx.clienteInternet.update({
        where: { id: clienteId },
        data: {
          estadoCliente: estadoCliente,
        },
      });

      return newPayment;
    });
  }
}
