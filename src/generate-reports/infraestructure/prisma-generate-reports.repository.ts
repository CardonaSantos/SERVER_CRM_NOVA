import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { GenerateReportsRepository } from '../domain/generate-reports.repository';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import { dayjs } from 'src/Utils/dayjs.config';
import * as ExcelJS from 'exceljs';
import { QueryCobranzaReport } from '../dto/cobranza-query-report';
import { Prisma } from '@prisma/client';
import { formattShortFecha } from 'src/Utils/formattFecha.utils';
import { formattMonedaGT } from 'src/Utils/formatt-moneda';
import { formattDateForFilter } from 'src/Utils/formattDateForFilter';

@Injectable()
export class PrismaGenerateReports implements GenerateReportsRepository {
  private readonly logger = new Logger(PrismaGenerateReports.name);

  constructor(private readonly prisma: PrismaService) {}

  async exportInfo(ids: number[]): Promise<Buffer> {
    try {
      const customers = await this.prisma.clienteInternet.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          creadoEn: true,
          direccion: true,
          telefono: true,
          dpi: true,
          estadoCliente: true,
          departamento: { select: { nombre: true } },
          municipio: { select: { nombre: true } },
          nota: true,
          ssidRouter: true,
          contrasenaWifi: true,
          IP: { select: { direccionIp: true } },
          ubicacion: { select: { latitud: true, longitud: true } },
          servicioInternet: { select: { nombre: true } },
          facturaInternet: { select: { estadoFacturaInternet: true } },
          observaciones: true,
          contactoReferenciaTelefono: true,
          sector: { select: { nombre: true } },
          creditos: { select: { estado: true } },
          ticketSoporte: { select: { estado: true } },
        },
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Clientes');

      worksheet.columns = [
        { header: 'ID', width: 8 }, // 1
        { header: 'Nombres', width: 25 }, // 2
        { header: 'Apellidos', width: 25 }, // 3
        { header: 'DPI', width: 15 }, // 4
        { header: 'Teléfono', width: 15 }, // 5
        { header: 'Tel. Referencia', width: 15 }, // 6
        { header: 'Estado', width: 15 }, // 7
        { header: 'Plan', width: 20 }, // 8
        { header: 'IP Asignada', width: 18 }, // 9
        { header: 'Departamento', width: 20 }, // 10
        { header: 'Municipio', width: 20 }, // 11
        { header: 'Sector', width: 20 }, // 12
        { header: 'Dirección', width: 40 }, // 13
        { header: 'Latitud', width: 15 }, // 14
        { header: 'Longitud', width: 15 }, // 15
        { header: 'SSID (Wifi)', width: 20 }, // 16
        { header: 'Pass (Wifi)', width: 15 }, // 17
        { header: 'Resumen Facturación', width: 30 }, // 18
        { header: 'Resumen Soporte Tec.', width: 30 }, // 19
        { header: 'Resumen Creditos.', width: 30 }, // 20
        { header: 'Observaciones', width: 30 }, // 21
        { header: 'Notas', width: 30 }, // 22
      ];

      for (const c of customers) {
        // --- CÁLCULOS ---
        const totalFacturas = c.facturaInternet.length;
        const pagadas = c.facturaInternet.filter(
          (f) => f.estadoFacturaInternet === 'PAGADA',
        ).length;
        const pendientes = totalFacturas - pagadas;

        const totalTickets = c.ticketSoporte.length;
        const ticketsResueltos = c.ticketSoporte.filter(
          (t) => t.estado === 'RESUELTA',
        ).length;
        const ticketsPendientes = totalTickets - ticketsResueltos;

        const totalCreditos = c.creditos.length;
        const creditosFinalizados = c.creditos.filter(
          (c) => c.estado === 'COMPLETADO',
        ).length;
        const creditosPendientes = totalCreditos - creditosFinalizados;

        const resumenFinanciero = `Total: ${totalFacturas}\nPagadas: ${pagadas}\nPendientes: ${pendientes}`;
        const resumenTecnico = `Total: ${totalTickets}\nResueltos: ${ticketsResueltos}\nPendientes: ${ticketsPendientes}`;
        const resumenCredito = `Total: ${totalCreditos}\nFinalizados: ${creditosFinalizados}\nPendientes: ${creditosPendientes}`;

        // --- FILA ---
        const row = worksheet.addRow([
          c.id,
          c.nombre,
          c.apellidos,
          c.dpi || '',
          c.telefono || '',
          c.contactoReferenciaTelefono || '',
          c.estadoCliente,
          c.servicioInternet?.nombre || 'Sin Plan',
          c.IP?.direccionIp || 'Sin IP',
          c.departamento?.nombre || '',
          c.municipio?.nombre || '',
          c.sector?.nombre || '',
          c.direccion || '',
          c.ubicacion?.latitud || '',
          c.ubicacion?.longitud || '',
          c.ssidRouter || '',
          c.contrasenaWifi || '',
          resumenFinanciero, // Col 18
          resumenTecnico, // Col 19
          resumenCredito, // Col 20
          c.observaciones || '', // Col 21
          c.nota || '', // Col 22
        ]);

        // --- ESTILOS ---
        row.eachCell((cell) => {
          cell.alignment = { vertical: 'top', horizontal: 'left' };
        });

        // WrapText para celdas multilinea (Dirección, Resúmenes, Notas)
        [13, 18, 19, 20, 21, 22].forEach((idx) => {
          row.getCell(idx).alignment = {
            vertical: 'top',
            horizontal: 'left',
            wrapText: true,
          };
        });

        // Color Rojo si hay deuda (Columna 18)
        if (pendientes > 0) {
          row.getCell(18).font = { color: { argb: 'C00000' } };
        }

        // Color Rojo si hay tickets pendientes (Columna 19)
        if (ticketsPendientes > 0) {
          row.getCell(19).font = { color: { argb: 'C00000' } };
        }
      }

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.height = 25;
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throwFatalError(error, this.logger, 'PrismaGenerateReports.ExportInfo');
    }
  }

  async generateHistorialPagos(ids: Array<number>): Promise<Buffer> {
    try {
      const customers = await this.prisma.clienteInternet.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          telefono: true,
          contactoReferenciaTelefono: true,
          facturaInternet: {
            select: {
              estadoFacturaInternet: true,
              montoPago: true,
              periodo: true,
              fechaPagada: true,
            },
          },
        },
      });

      const periodosSet = new Set<string>();
      customers.forEach((c) => {
        c.facturaInternet.forEach((f) => periodosSet.add(f.periodo));
      });
      const periodosOrdenados = Array.from(periodosSet).sort();

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Historial Pagos');

      const columnasBase = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Cliente', key: 'nombre', width: 35 },
        { header: 'Telefono', key: 'telefono', width: 15 },
        { header: 'Tel. Referencia', key: 'telefonoReferencia', width: 15 },
      ];

      const columnasDinamicas = periodosOrdenados.map((periodo) => ({
        header: `Fact. ${periodo}`,
        key: periodo,
        width: 18,
      }));

      worksheet.columns = [...columnasBase, ...columnasDinamicas];

      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { horizontal: 'center' };

      for (const c of customers) {
        const filaData: any = {
          id: c.id,
          nombre: `${c.nombre} ${c.apellidos}`,
          telefono: c.telefono || '',
          telefonoReferencia: c.contactoReferenciaTelefono || '',
        };

        // Rellenar datos dinámicos en el objeto
        c.facturaInternet.forEach((f) => {
          let dateFormatted = '';
          if (f.fechaPagada) {
            dateFormatted = dayjs(f.fechaPagada).format('DD/MM/YYYY h:mm A');
          }
          filaData[f.periodo] =
            `${f.estadoFacturaInternet}\nQ${f.montoPago}${dateFormatted ? '\n' + dateFormatted : ''}`;
        });

        // Agregar la fila
        const row = worksheet.addRow(filaData);

        // 7. Estilizar Celdas Dinámicas
        periodosOrdenados.forEach((periodo) => {
          const cell = row.getCell(periodo);

          // Si filaData tenía datos para este periodo:
          if (filaData[periodo]) {
            cell.alignment = {
              wrapText: true,
              horizontal: 'center',
              vertical: 'middle',
            };

            // Lógica de colores
            if (String(filaData[periodo]).includes('PENDIENTE')) {
              cell.font = { color: { argb: 'C00000' }, bold: true }; // Rojo
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFEBEE' }, // Fondo rosado suave
              };
            } else {
              cell.font = { color: { argb: '006400' }, bold: true }; // Verde oscuro
            }
          } else {
            // Si NO tiene factura en este periodo (Celda vacía)
            cell.value = '-';
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.font = { color: { argb: 'CCCCCC' } }; // Gris claro
          }
        });

        // Ajustar alineación de columnas base
        row.getCell('id').alignment = { horizontal: 'center', vertical: 'top' };
        row.getCell('nombre').alignment = {
          horizontal: 'left',
          vertical: 'top',
        };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaGenerateReports.GenerateHistorialPagos',
      );
    }
  }

  async cobranzaReport(dto: QueryCobranzaReport): Promise<Buffer> {
    try {
      const { endDate, startDate, userId, estados, endDateG, startDateG } = dto;

      const where: Prisma.FacturaInternetWhereInput = {};

      if (startDate && endDate) {
        where.fechaPagada = {
          gte: formattDateForFilter('start', startDate),
          lte: formattDateForFilter('end', endDate),
        };
      }

      if (startDateG && endDateG) {
        where.creadoEn = {
          gte: formattDateForFilter('start', startDateG),
          lte: formattDateForFilter('end', endDateG),
        };
      }

      if (userId) {
        where.pagos = {
          some: {
            cobradorId: userId,
          },
        };
      }

      if (estados?.length > 0) {
        where.estadoFacturaInternet = {
          in: estados,
        };
      }

      this.logger.log('El where construido es: ', where);

      const facturasRaw = await this.prisma.facturaInternet.findMany({
        where,
        orderBy: {
          fechaPagada: 'desc',
        },
        select: {
          id: true,
          fechaPagada: true,
          fechaPagoEsperada: true,
          creadoEn: true,
          estadoFacturaInternet: true,
          montoPago: true,
          pagos: {
            select: {
              id: true,
              fechaPago: true,
              montoPagado: true,
              numeroBoleta: true,
              metodoPago: true,
              cobrador: {
                select: {
                  id: true,
                  nombre: true,
                  rol: true,
                },
              },
            },
          },
          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              direccion: true,
              sector: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

      const montoTotalSum = facturasRaw.reduce(
        (acc, fact) => acc + fact.montoPago,
        0,
      );
      const totalFacturas = facturasRaw.length;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reporte Pagos');

      worksheet.columns = [
        { header: 'ID', width: 10 },

        { header: 'Cliente', width: 40 },
        { header: 'Dirección', width: 55 },
        { header: 'Sector', width: 18 },

        { header: 'Fecha Vencimiento', width: 18 },
        { header: 'Fecha Pagada', width: 18 },
        { header: 'Estado', width: 15 },
        { header: 'Monto', width: 15 },

        { header: 'Metodo Pago', width: 15 },
        { header: 'No. Boleta', width: 15 },

        { header: 'Cobrador', width: 25 },

        { header: 'Total Facturas', width: 25 },
        { header: 'Monto Total', width: 25 },
      ];

      worksheet.getRow(1).font = { bold: true };

      for (const fact of facturasRaw) {
        const cobradores = fact.pagos
          .map((p) => p?.cobrador?.nombre)
          .filter(Boolean);
        const cobradorNombres =
          cobradores.length > 0 ? cobradores.join(', ') : 'N/A';

        const id = fact.id;

        const clienteNombre = `${fact.cliente?.nombre ?? ''} ${fact.cliente?.apellidos ?? ''}`;
        const direccion = fact.cliente?.direccion;
        const sector = fact.cliente?.sector?.nombre ?? 'N/A';

        const metodoPago = fact?.pagos[0]?.metodoPago ?? 'N/A';

        const noBoleta = fact?.pagos[0]?.numeroBoleta ?? 'N/A';

        const fVenc = fact.fechaPagoEsperada
          ? formattShortFecha(fact.fechaPagoEsperada)
          : 'N/A';
        const fPagada = fact.fechaPagada
          ? formattShortFecha(fact.fechaPagada)
          : 'N/A';
        const estado = fact.estadoFacturaInternet;
        const monto = fact.pagos.reduce((acc, f) => acc + f.montoPagado, 0);

        worksheet.addRow([
          id,
          clienteNombre,
          direccion,
          sector,
          fVenc,
          fPagada,
          estado,
          formattMonedaGT(monto),
          metodoPago,
          noBoleta,
          cobradorNombres,
        ]);
      }

      worksheet.getCell('L2').value = totalFacturas;
      worksheet.getCell('M2').value = formattMonedaGT(montoTotalSum);

      worksheet.getCell('L2').font = { bold: true };
      worksheet.getCell('M2').font = { bold: true };

      const buff = await workbook.xlsx.writeBuffer();
      return Buffer.from(buff);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throwFatalError(
        error,
        this.logger,
        'PrismaGenerateReports.cobranzaReport',
      );
    }
  }
}
