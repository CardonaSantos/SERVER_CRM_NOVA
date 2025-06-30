import { Injectable, Logger, NotFoundException } from '@nestjs/common';

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
    return await this.prisma.$transaction(async (tx) => {
      console.log('La data llegando es: ', createRutaCobroDto);

      const newRutaCobro = await tx.ruta.create({
        data: {
          nombreRuta: createRutaCobroDto.nombreRuta,
          cobrador: createRutaCobroDto.cobradorId
            ? {
                connect: {
                  id: createRutaCobroDto.cobradorId,
                },
              }
            : undefined, // Dejar undefined si no se pasa un cobradorId
          empresa: {
            connect: {
              id: createRutaCobroDto.empresaId,
            },
          },
          clientes: {
            connect: createRutaCobroDto.clientes.map((id) => ({ id })),
          },
          observaciones: createRutaCobroDto.observaciones,

          // cobrados: 0,
          // montoCobrado: 0,
          // estadoRuta: 'ACTIVO', // Suponiendo que 'ACTIVO' es un valor válido para el enum EstadoRuta
        },
      });

      console.log('La nueva ruta es: ', newRutaCobro);

      return newRutaCobro; // Retornar la ruta recién creada
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

  async findAllRutas() {
    const rutas = await this.prisma.ruta.findMany({
      include: {
        empresa: true, // Incluye la empresa relacionada
        cobrador: true, // Incluye el cobrador (usuario) relacionado
        clientes: {
          include: {
            empresa: true, // Incluye la empresa del cliente
            ubicacion: true, // Incluye la ubicación del cliente
            saldoCliente: true,
            facturaInternet: true,
          },
        },
      },
    });

    const x = rutas.map((ruta) => ({
      id: ruta.id,
      nombreRuta: ruta.nombreRuta,
      cobradorId: ruta.cobradorId,
      cobrador: ruta.cobrador
        ? {
            id: ruta.cobrador.id,
            nombre: ruta.cobrador.nombre,
            apellidos: ruta.cobrador.nombre,
            email: ruta.cobrador.correo,
            telefono: ruta.cobrador.telefono,
            rol: ruta.cobrador.rol,
          }
        : undefined,
      empresaId: ruta.empresaId,
      empresa: {
        id: ruta.empresa.id,
        nombre: ruta.empresa.nombre,
      },
      //PARA EL CLIENTE DE LA RUTA
      clientes: ruta.clientes.map((cliente) => ({
        id: cliente.id,
        nombre: cliente.nombre,
        apellidos: cliente.apellidos,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        dpi: cliente.dpi,
        estadoCliente: cliente.estadoCliente,
        empresaId: cliente.empresaId,
        empresa: cliente.empresa
          ? {
              id: cliente.empresa.id,
              nombre: cliente.empresa.nombre,
            }
          : undefined,
        ubicacion: cliente.ubicacion
          ? {
              id: cliente.ubicacion.id,
              latitud: cliente.ubicacion.latitud,
              longitud: cliente.ubicacion.longitud,
              direccion: cliente.direccion,
            }
          : undefined,
        saldoPendiente: cliente.saldoCliente?.saldoPendiente ?? 0,
        facturasPendientes: cliente.facturaInternet.filter(
          (f) => f.estadoFacturaInternet === 'PENDIENTE',
        ),
        facturacionZona: cliente.facturacionZonaId,
      })),
      // cobrados: ruta.cobrados,
      montoCobrado: ruta.montoCobrado,
      estadoRuta: ruta.estadoRuta,
      fechaCreacion: ruta.creadoEn,
      fechaActualizacion: ruta.actualizadoEn,
      observaciones: ruta.observaciones,
      diasCobro: ['MARTES'],
    }));

    // console.log('RUTAS: ', x);
    return x;
  }

  async finRutaCobro(rutaId: number) {
    try {
      console.log('El id pasando es: ', rutaId);

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
        clientes: ruta?.clientes.map((cliente) => ({
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
        })),
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
      select: {
        id: true,
        nombreRuta: true,
        cobradorId: true,
        cobrador: {
          select: {
            id: true,
            nombre: true,
            // apellidos: true,
            correo: true,
            telefono: true,
            rol: true,
          },
        },
        empresaId: true,
        empresa: {
          select: { id: true, nombre: true },
        },
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
            // Solo contamos facturas pendientes
            facturaInternet: {
              where: {
                estadoFacturaInternet: {
                  in: ['PENDIENTE', 'VENCIDA', 'PARCIAL'],
                },
              },
              select: { id: true },
            },
            // Si tienes una relación de saldoCliente
            saldoCliente: {
              select: { saldoPendiente: true },
            },
          },
        },
        montoCobrado: true,
        estadoRuta: true,
        observaciones: true,
        creadoEn: true,
        actualizadoEn: true,
        CobroRuta: { select: { id: true } }, // para contar cuántos cobros hay
      },
    });

    if (!ruta) throw new NotFoundException('Ruta no encontrada');

    return {
      id: ruta.id,
      nombreRuta: ruta.nombreRuta,
      cobradorId: ruta.cobradorId,
      cobrador: ruta.cobrador,
      empresaId: ruta.empresaId,
      empresa: ruta.empresa,
      clientes: ruta.clientes.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        apellidos: c.apellidos,
        telefono: c.telefono,
        direccion: c.direccion,
        dpi: c.dpi,
        estadoCliente: c.estadoCliente,
        empresaId: c.empresaId,
        empresa: c.empresa,
        ubicacion: c.ubicacion ?? undefined,
        saldoPendiente: c.saldoCliente?.saldoPendiente ?? 0,
        facturasPendientes: c.facturaInternet.length,
        facturacionZona: c.facturacionZonaId!,
      })),
      cobrados: ruta.CobroRuta.length,
      montoCobrado: ruta.montoCobrado,
      estadoRuta: ruta.estadoRuta,
      fechaCreacion: ruta.creadoEn.toISOString(),
      fechaActualizacion: ruta.actualizadoEn.toISOString(),
      observaciones: ruta.observaciones ?? undefined,
      diasCobro: [], // si tienes lógica para días, inclúyelos aquí
    };
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
        facturas: c.facturaInternet
          .map(
            (fac) =>
              `Mes: ${dayjs(fac.fechaPagoEsperada).format('MMMM YYYY')}, Monto: Q${fac.montoPago}`,
          )
          .join('\n'),
        observaciones: c.observaciones ?? '',
        fechaInstalacion: dayjs(c.fechaInstalacion).format('DD MMMM YYYY'), // Ej: "05 julio 2025"
        sector: c.sector.nombre,
        plan: c.servicioInternet.nombre,

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
      return error;
    }
  }
}
