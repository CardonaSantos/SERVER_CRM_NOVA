import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { CreateRutaDto } from './dto/create-ruta-cobro.dto';
import { UpdateRutaDto } from './dto/update-ruta-cobro.dto';
import { CreateNewRutaDto } from './dto/create-new-ruta.dto';
import { Ruta } from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as ExcelJS from 'exceljs';
// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('es'); // Establece español como idioma predeterminado

@Injectable()
export class RutaCobroService {
  private readonly logger = new Logger(RutaCobroService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createRutaCobroDto: CreateNewRutaDto) {
    const {
      cobradorId,
      empresaId,
      nombreRuta,
      observaciones,
      facturas,
      asignadoPor,
    } = createRutaCobroDto;

    if (facturas.length <= 0) {
      throw new BadRequestException('Facturas seleccionadas no válidas');
    }

    return await this.prisma.$transaction(async (tx) => {
      const facturasFound = await tx.facturaInternet.findMany({
        where: { id: { in: facturas } },
        select: { id: true, clienteId: true },
      });

      const newRuta = await tx.ruta.create({
        data: {
          estadoRuta: 'ASIGNADA',
          montoCobrado: 0,
          observaciones,
          nombreRuta,
          cobrador: { connect: { id: cobradorId } },
          empresa: { connect: { id: empresaId } },
        },
      });

      // Vincular facturas
      await Promise.all(
        facturasFound.map((f) =>
          tx.facturaRuta.create({
            data: {
              ruta: { connect: { id: newRuta.id } },
              factura: { connect: { id: f.id } },
              asignadaPor: { connect: { id: asignadoPor } },
            },
          }),
        ),
      );

      // Vincular clientes únicos
      const clientesIds = [...new Set(facturasFound.map((f) => f.clienteId))];
      if (clientesIds.length > 0) {
        await tx.ruta.update({
          where: { id: newRuta.id },
          data: {
            clientes: { connect: clientesIds.map((id) => ({ id })) },
          },
        });
      }

      return newRuta;
    });
  }

  async updateOneRutaCobro(id: number, updateRuta: UpdateRutaDto) {
    const {
      nombreRuta,
      cobradorId,
      empresaId,
      estadoRuta,
      observaciones,
      clientes,
    } = updateRuta;

    return await this.prisma.$transaction(async (tx) => {
      await tx.ruta.update({
        where: { id },
        data: {
          clientes: {
            set: [],
          },
        },
      });

      const rutaActualizada = await tx.ruta.update({
        where: { id },
        data: {
          nombreRuta,
          observaciones,
          estadoRuta,
          cobrador: cobradorId
            ? {
                connect: { id: cobradorId },
              }
            : {
                disconnect: true,
              },
          empresa: empresaId
            ? {
                connect: { id: empresaId },
              }
            : undefined,
          clientes: {
            connect: clientes.map((id) => ({ id })),
          },
        },
      });

      return rutaActualizada;
    });
  }

  findAll() {
    return `This action returns all rutaCobro`;
  }

  /**
   *
   * @returns Encuentra todas las rutas de cobros
   */
  async findAllRutas() {
    const rutas = await this.prisma.ruta.findMany({
      orderBy: { creadoEn: 'desc' },
      select: {
        id: true,
        nombreRuta: true,
        cobradorId: true,
        empresaId: true,
        estadoRuta: true,
        creadoEn: true,
        actualizadoEn: true,
        observaciones: true,
        empresa: { select: { id: true, nombre: true } },
        cobrador: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            rol: true,
          },
        },
        clientes: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            contactoReferenciaTelefono: true,
            direccion: true,
            dpi: true,
            estadoCliente: true,
            empresaId: true,
            empresa: { select: { id: true, nombre: true } },
            ubicacion: { select: { id: true, latitud: true, longitud: true } },
            facturacionZonaId: true,
            saldoCliente: { select: { saldoPendiente: true } },
            facturaInternet: {
              where: {
                estadoFacturaInternet: {
                  in: ['VENCIDA', 'PENDIENTE', 'PARCIAL'],
                },
              },
              select: {
                id: true,
                estadoFacturaInternet: true,
                montoPago: true,
                saldoPendiente: true,
              },
            },
          },
        },
      },
    });

    if (!rutas)
      throw new NotFoundException('No se encontraron rutas de cobros');

    const x = rutas.map((ruta) => {
      const facturasRuta = ruta.clientes.flatMap(
        (c) => c.facturaInternet ?? [],
      );
      const totalACobrar = facturasRuta.reduce(
        (t, f) => t + (f.montoPago ?? 0),
        0,
      );
      const totalPendienteRuta = facturasRuta.reduce(
        (t, f) => t + (f.saldoPendiente ?? 0),
        0,
      );
      const totalCobrado = totalACobrar - totalPendienteRuta;

      return {
        id: ruta.id,
        nombreRuta: ruta.nombreRuta,
        cobradorId: ruta.cobradorId,
        cobrador: ruta.cobrador
          ? {
              id: ruta.cobrador.id,
              nombre: ruta.cobrador.nombre,
              email: ruta.cobrador.correo,
              telefono: ruta.cobrador.telefono,
              rol: ruta.cobrador.rol,
            }
          : undefined,
        empresaId: ruta.empresaId,
        empresa: { id: ruta.empresa.id, nombre: ruta.empresa.nombre },
        clientes: ruta.clientes.map((cliente) => {
          const totalPendienteCliente = (cliente.facturaInternet ?? []).reduce(
            (acc, f) => acc + (f.saldoPendiente ?? 0),
            0,
          );
          return {
            id: cliente.id,
            nombre: cliente.nombre,
            apellidos: cliente.apellidos,
            telefono: cliente.telefono,
            telefonoReferencia: cliente.contactoReferenciaTelefono,
            direccion: cliente.direccion,
            dpi: cliente.dpi,
            estadoCliente: cliente.estadoCliente,
            empresaId: cliente.empresaId,
            empresa: cliente.empresa
              ? { id: cliente.empresa.id, nombre: cliente.empresa.nombre }
              : undefined,
            ubicacion: cliente.ubicacion
              ? {
                  id: cliente.ubicacion.id,
                  latitud: cliente.ubicacion.latitud,
                  longitud: cliente.ubicacion.longitud,
                  direccion: cliente.direccion,
                }
              : undefined,
            saldoPendiente: totalPendienteCliente,
            facturasPendientes: (cliente.facturaInternet ?? []).filter(
              (f) => f.estadoFacturaInternet === 'PENDIENTE',
            ),
            facturacionZona: cliente.facturacionZonaId,
          };
        }),
        estadoRuta: ruta.estadoRuta,
        fechaCreacion: ruta.creadoEn,
        fechaActualizacion: ruta.actualizadoEn,
        observaciones: ruta.observaciones,
        diasCobro: ['MARTES'],
        totalACobrar,
        totalCobrado,
        porCobrar: totalPendienteRuta,
      };
    });

    return x;
  }

  /**
   *
   * @param rutaId I
   * @returns Ruta con data completa para cobro
   */
  async finRutaCobro(rutaId: number) {
    try {
      if (!rutaId) throw new BadRequestException('ID de ruta no válido');

      const ruta = await this.prisma.ruta.findUnique({
        where: { id: rutaId },
        select: {
          id: true,
          nombreRuta: true,
          creadoEn: true,
          actualizadoEn: true,
          cobrador: {
            select: {
              id: true,
              nombre: true,
              correo: true,
            },
          },
          clientes: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              creadoEn: true,
              telefono: true,
              contactoReferenciaTelefono: true,
              contactoReferenciaNombre: true,
              direccion: true,
              ubicacion: {
                select: {
                  latitud: true,
                  longitud: true,
                  id: true,
                },
              },
              facturaInternet: {
                where: {
                  estadoFacturaInternet: {
                    in: ['PENDIENTE', 'VENCIDA', 'PARCIAL'],
                  },
                },
                select: {
                  id: true,
                  montoPago: true,
                  estadoFacturaInternet: true,
                  saldoPendiente: true,
                  creadoEn: true,
                  detalleFactura: true,
                },
              },
              saldoCliente: {
                select: {
                  saldoFavor: true,
                  saldoPendiente: true,
                  ultimoPago: true,
                },
              },
            },
          },
        },
      });

      // Formatear los datos para el cliente
      const response = {
        id: ruta?.id,
        nombreRuta: ruta?.nombreRuta,
        creadoEn: ruta?.creadoEn,
        actualizadoEn: ruta?.actualizadoEn,
        cobrador: {
          id: ruta?.cobrador?.id,
          nombre: ruta?.cobrador?.nombre,
          correo: ruta?.cobrador?.correo,
        },
        clientes: ruta?.clientes
          .sort(
            (a, b) =>
              b.facturaInternet.reduce((acc, f) => acc + f.saldoPendiente, 0) -
              a.facturaInternet.reduce((acc, f) => acc + f.saldoPendiente, 0),
          )
          .map((cliente) => {
            const totalDebe = cliente.facturaInternet.reduce(
              (acc, factura) => acc + factura.saldoPendiente,
              0,
            );

            return {
              id: cliente.id,
              nombreCompleto: `${cliente.nombre} ${cliente.apellidos}`,
              telefono: cliente.telefono,
              direccion: cliente.direccion,
              imagenes: [],
              contactoReferencia: {
                telefono: cliente.contactoReferenciaTelefono,
                nombre: cliente.contactoReferenciaNombre,
              },
              ubicacion:
                cliente.ubicacion &&
                cliente.ubicacion.latitud &&
                cliente.ubicacion.longitud
                  ? {
                      latitud: cliente.ubicacion.latitud,
                      longitud: cliente.ubicacion.longitud,
                    }
                  : [], // Si no existe ubicacion, devuelve un array vacío
              facturas: cliente.facturaInternet.map((factura) => ({
                id: factura.id,
                montoPago: factura.montoPago,
                estadoFactura: factura.estadoFacturaInternet,
                saldoPendiente: factura.saldoPendiente,
                creadoEn: factura.creadoEn,
                detalleFactura: factura.detalleFactura,
              })),
              saldo: {
                saldoFavor: cliente.saldoCliente?.saldoFavor ?? 0,
                saldoPendiente: cliente.saldoCliente?.saldoPendiente ?? 0,
                ultimoPago: cliente.saldoCliente?.ultimoPago ?? null,
              },
              //nuevo
              totalDebe: totalDebe,
            };
          }),
      };

      return response;
    } catch (error) {
      console.log(error);
      throw new Error('Error al obtener la ruta de cobro');
    }
  }

  // rutas-cobro.service.ts

  async getRutaCobroToEdit(rutaId: number) {
    const ruta = await this.prisma.ruta.findUnique({
      where: { id: rutaId },
      include: {
        cobrador: {
          select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            rol: true,
          },
        },
        empresa: { select: { id: true, nombre: true } },
        clientes: {
          select: {
            id: true,
            nombre: true,
            apellidos: true,
            telefono: true,
            direccion: true,
            dpi: true,
            estadoCliente: true,
            empresaId: true,
            empresa: { select: { id: true, nombre: true } },
            ubicacion: { select: { id: true, latitud: true, longitud: true } },
            facturacionZonaId: true,
            // Solo contamos facturas con saldo/pendientes
            facturaInternet: {
              where: {
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'VENCIDA', 'PARCIAL'],
                },
              },
              select: { id: true }, // traemos solo ids para contar
            },
            saldoCliente: { select: { saldoPendiente: true } },
          },
        },
        // << Importante: en el schema es "cobros"
        cobros: { select: { id: true } },
      },
    });

    if (!ruta) throw new NotFoundException('Ruta no encontrada');

    return {
      id: ruta.id,
      nombreRuta: ruta.nombreRuta,
      cobradorId: ruta.cobradorId ?? undefined,
      cobrador: ruta.cobrador ?? undefined,
      empresaId: ruta.empresaId,
      empresa: ruta.empresa,
      clientes: ruta.clientes.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        apellidos: c.apellidos ?? undefined,
        telefono: c.telefono ?? undefined,
        direccion: c.direccion ?? undefined,
        dpi: c.dpi ?? undefined,
        estadoCliente: c.estadoCliente,
        empresaId: c.empresaId,
        empresa: c.empresa,
        ubicacion: c.ubicacion ?? undefined,
        saldoPendiente: c.saldoCliente?.saldoPendiente ?? 0,
        facturasPendientes: c.facturaInternet.length,
        facturacionZona: c.facturacionZonaId ?? undefined,
      })),
      cobrados: ruta.cobros.length,
      montoCobrado: ruta.montoCobrado,
      estadoRuta: ruta.estadoRuta,
      fechaCreacion: ruta.creadoEn.toISOString(),
      fechaActualizacion: ruta.actualizadoEn.toISOString(),
      observaciones: ruta.observaciones ?? undefined,
      diasCobro: [], // si luego guardas días en BD, mapéalos aquí
    } as const;
  }

  findOne(id: number) {
    return `This action returns a #${id} rutaCobro`;
  }

  update(id: number, updateRutaCobroDto: UpdateRutaDto) {
    return `This action updates a #${id} rutaCobro`;
  }

  remove(id: number) {
    return `This action removes a #${id} rutaCobro`;
  }

  async removeOneRuta(rutaId: number) {
    try {
      const rutaToDelete = await this.prisma.ruta.findUnique({
        where: {
          id: rutaId,
        },
      });

      if (!rutaToDelete) {
        throw new NotFoundException('Error al encontrar ruta de eliminación');
      }

      return await this.prisma.ruta.delete({
        where: {
          id: rutaToDelete.id,
        },
      });
    } catch (error) {
      console.log(error);
    }
  }

  async removeAll() {
    try {
      return await this.prisma.ruta.deleteMany({});
    } catch (error) {
      console.log(error);
    }
  }

  async closeRuta(rutaId: number) {
    try {
      const rutaToClose = await this.prisma.ruta.findUnique({
        where: {
          id: rutaId,
        },
      });

      if (!rutaToClose) {
        throw new NotFoundException('Ruta no encontrada');
      }

      const rutaclosed = await this.prisma.ruta.update({
        where: {
          id: rutaId,
        },
        data: {
          estadoRuta: 'CERRADO',
        },
      });

      return rutaclosed;
    } catch (error) {
      console.log(error);
    }
  }

  async downloadExcelRutaCobro(id: number) {
    try {
      const rutaCobro = await this.prisma.ruta.findUnique({
        where: {
          id: id,
        },
        select: {
          nombreRuta: true,
          cobrador: {
            select: {
              id: true,
              nombre: true,
              rol: true,
            },
          },
          observaciones: true,
          clientes: {
            select: {
              fechaInstalacion: true,
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              direccion: true,
              contactoReferenciaTelefono: true,
              ubicacion: true,
              observaciones: true,
              facturaInternet: {
                where: {
                  estadoFacturaInternet: {
                    in: ['PENDIENTE', 'VENCIDA', 'PARCIAL'],
                  },
                },
              },
              servicioInternet: {
                select: {
                  nombre: true,
                },
              },
              sector: {
                select: {
                  nombre: true,
                },
              },
            },
          },
        },
      });

      this.logger.debug('La ruta encontrada es: ', rutaCobro);

      const arrayToExcel = rutaCobro.clientes.map((c) => ({
        nombre: `${c.nombre} ${c.apellidos}`,
        telefono: c.telefono,
        telefonoReferencia: c.contactoReferenciaTelefono,
        direccion: c.direccion,
        facturas: (c.facturaInternet ?? [])
          .map(
            (fac) =>
              `Mes: ${dayjs(fac.fechaPagoEsperada).format('MMMM YYYY')}, Monto: Q${fac.montoPago}`,
          )
          .join('\n'),
        observaciones: c.observaciones ?? '',
        fechaInstalacion: c.fechaInstalacion
          ? dayjs(c.fechaInstalacion).format('DD MMMM YYYY')
          : '',
        sector: c.sector?.nombre ?? '', // ✅ safe
        plan: c.servicioInternet?.nombre ?? '', // ✅ safe
        ubicacion: c.ubicacion
          ? `${c.ubicacion.latitud},${c.ubicacion.longitud}`
          : '',
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(rutaCobro.nombreRuta);
      // 1. Define columnas primero
      worksheet.columns = [
        { header: 'Nombre', key: 'nombre', width: 35 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Tel. Referencia', key: 'telefonoReferencia', width: 18 },
        { header: 'Dirección', key: 'direccion', width: 40 },

        { header: 'Sector', key: 'sector', width: 20 },
        { header: 'Facturas Pendientes', key: 'facturas', width: 35 },
        { header: 'Plan', key: 'plan', width: 25 },

        { header: 'Fecha Instalacion', key: 'fechaInstalacion', width: 20 },
        { header: 'Observaciones', key: 'observaciones', width: 25 },
        { header: 'Ubicación', key: 'ubicacion', width: 40 },
      ];

      // 2. Ahora puedes acceder y configurar las columnas por key
      worksheet.getColumn('facturas').alignment = { wrapText: true };
      worksheet.getColumn('direccion').alignment = { wrapText: true };

      arrayToExcel.forEach((item) => worksheet.addRow(item));

      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error) {
      this.logger.error('El error es: ', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Fatal error: Error inesperado en ruta cobro excel',
      );
    }
  }
}
