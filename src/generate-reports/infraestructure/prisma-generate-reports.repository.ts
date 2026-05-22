import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GenerateReportsRepository } from '../domain/generate-reports.repository';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import { dayjs } from 'src/Utils/dayjs.config';
import * as ExcelJS from 'exceljs';
import { QueryCobranzaReport } from '../dto/cobranza-query-report';
import {
  EstadoTicketSoporte,
  PrioridadTicketSoporte,
  Prisma,
} from '@prisma/client';
import { formattShortFecha } from 'src/Utils/formattFecha.utils';
import { formattMonedaGT } from 'src/Utils/formatt-moneda';
import { formattDateForFilter } from 'src/Utils/formattDateForFilter';
import { QueryTicketsDailyReportDto } from '../dto/ticket-metricas.dto';

@Injectable()
export class PrismaGenerateReports implements GenerateReportsRepository {
  private readonly logger = new Logger(PrismaGenerateReports.name);

  private readonly closedTicketStates: EstadoTicketSoporte[] = [
    EstadoTicketSoporte.RESUELTA,
    EstadoTicketSoporte.CERRADO,
    EstadoTicketSoporte.ARCHIVADA,
  ];

  private readonly cancelTicketStates: EstadoTicketSoporte[] = [
    EstadoTicketSoporte.CANCELADA,
  ];

  private readonly pendingTicketStates: EstadoTicketSoporte[] = [
    EstadoTicketSoporte.PENDIENTE,
    EstadoTicketSoporte.PENDIENTE_CLIENTE,
    EstadoTicketSoporte.PENDIENTE_TECNICO,
    EstadoTicketSoporte.PENDIENTE_REVISION,
  ];

  private readonly priorityOrder: PrioridadTicketSoporte[] = [
    PrioridadTicketSoporte.URGENTE,
    PrioridadTicketSoporte.ALTA,
    PrioridadTicketSoporte.MEDIA,
    PrioridadTicketSoporte.BAJA,
  ];

  constructor(private readonly prisma: PrismaService) {}

  async ticketsDailyReport(dto: QueryTicketsDailyReportDto): Promise<Buffer> {
    try {
      const { start, end, label } = this.resolveTicketReportDateRange(dto);

      const modoFecha = dto.modoFecha ?? 'ACTIVIDAD';

      const baseAnd: Prisma.TicketSoporteWhereInput[] = [];

      if (dto.empresaId) {
        baseAnd.push({
          empresaId: Number(dto.empresaId),
        });
      }

      if (dto.tecnicoId) {
        const tecnicoId = Number(dto.tecnicoId);

        baseAnd.push({
          OR: [
            { tecnicoId },
            {
              asignaciones: {
                some: {
                  tecnicoId,
                },
              },
            },
          ],
        });
      }

      if (dto.estados?.length > 0) {
        baseAnd.push({
          estado: {
            in: dto.estados,
          },
        });
      }

      if (dto.prioridades?.length > 0) {
        baseAnd.push({
          prioridad: {
            in: dto.prioridades,
          },
        });
      }

      const fechaWhere = this.buildTicketDateWhere(modoFecha, start, end);

      const where: Prisma.TicketSoporteWhereInput = {
        AND: [...baseAnd, fechaWhere],
      };

      this.logger.log(
        `Generando reporte diario de tickets. Rango=${label}. ModoFecha=${modoFecha}`,
      );

      const ticketsRaw = await this.prisma.ticketSoporte.findMany({
        where,
        orderBy: [{ prioridad: 'desc' }, { fechaApertura: 'desc' }],
        select: {
          id: true,
          estado: true,
          prioridad: true,
          titulo: true,
          descripcion: true,

          fechaApertura: true,
          fechaAsignacion: true,
          fechaInicioAtencion: true,
          fechaResolucionTecnico: true,
          fechaCierre: true,
          creadoEn: true,
          actualizadoEn: true,

          clienteId: true,
          tecnicoId: true,
          creadoPorId: true,
          empresaId: true,

          fijado: true,

          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },

          cliente: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              telefono: true,
              direccion: true,
              sector: {
                select: {
                  id: true,
                  nombre: true,
                },
              },
            },
          },

          tecnico: {
            select: {
              id: true,
              nombre: true,
              rol: true,
            },
          },

          creadoPor: {
            select: {
              id: true,
              nombre: true,
              rol: true,
            },
          },

          asignaciones: {
            select: {
              id: true,
              tecnicoId: true,
              esResponsable: true,
              resolvioEn: true,
              tiempoTecnicoMinutos: true,
              creadoEn: true,
              tecnico: {
                select: {
                  id: true,
                  nombre: true,
                  rol: true,
                },
              },
            },
          },

          resumen: {
            select: {
              reabierto: true,
              numeroReaperturas: true,
              intentos: true,
              tiempoTotalMinutos: true,
              tiempoTecnicoMinutos: true,
              resueltoComo: true,
              notasInternas: true,
              solucion: {
                select: {
                  id: true,
                  solucion: true,
                },
              },
            },
          },

          boleta: {
            select: {
              conforme: true,
              firmadoPor: true,
              fechaFirma: true,
            },
          },

          logsTiempo: {
            select: {
              tecnicoId: true,
              inicio: true,
              fin: true,
              duracionMinutos: true,
            },
          },

          etiquetas: {
            select: {
              etiqueta: {
                select: {
                  nombre: true,
                },
              },
            },
          },

          _count: {
            select: {
              SeguimientoTicket: true,
            },
          },
        },
      });

      const workbook = new ExcelJS.Workbook();

      workbook.creator = 'CRM/POS';
      workbook.created = new Date();
      workbook.modified = new Date();

      const dashboard = workbook.addWorksheet('Dashboard', {
        views: [{ showGridLines: false }],
      });

      const detalle = workbook.addWorksheet('Detalle Tickets', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      const tecnicosSheet = workbook.addWorksheet('Rendimiento Técnicos', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      const prioridadesSheet = workbook.addWorksheet('SLA Prioridades', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      const isClosed = (estado: EstadoTicketSoporte) =>
        this.closedTicketStates.includes(estado);

      const isOpen = (estado: EstadoTicketSoporte) =>
        !this.closedTicketStates.includes(estado) &&
        !this.cancelTicketStates.includes(estado);

      const totalTickets = ticketsRaw.length;

      const ticketsAbiertos = ticketsRaw.filter((t) => isOpen(t.estado)).length;

      const ticketsEnProceso = ticketsRaw.filter(
        (t) => t.estado === EstadoTicketSoporte.EN_PROCESO,
      ).length;

      const ticketsPendientes = ticketsRaw.filter((t) =>
        this.pendingTicketStates.includes(t.estado),
      ).length;

      const ticketsCerrados = ticketsRaw.filter((t) =>
        isClosed(t.estado),
      ).length;

      const ticketsCancelados = ticketsRaw.filter((t) =>
        this.cancelTicketStates.includes(t.estado),
      ).length;

      const ticketsSinAsignar = ticketsRaw.filter(
        (t) =>
          isOpen(t.estado) &&
          !t.tecnicoId &&
          (!t.asignaciones || t.asignaciones.length === 0),
      ).length;

      const ticketsReabiertos = ticketsRaw.filter(
        (t) => t.resumen?.reabierto,
      ).length;

      const totalReaperturas = ticketsRaw.reduce(
        (acc, t) => acc + (t.resumen?.numeroReaperturas ?? 0),
        0,
      );

      const ticketsConEtiquetaInstalacion = ticketsRaw.filter((t) =>
        t.etiquetas?.some((et) =>
          et.etiqueta.nombre.toLowerCase().includes('instal'),
        ),
      ).length;

      const slaRows = this.buildSlaRowsByPriority(ticketsRaw);

      const slaGlobal = this.calculateGlobalSlaPercent(ticketsRaw);

      const tecnicoRows = this.buildTecnicoPerformanceRows(
        ticketsRaw,
        isClosed,
      );

      this.buildDashboardSheet(dashboard, {
        label,
        generatedAt: new Date(),
        totalTickets,
        ticketsAbiertos,
        ticketsEnProceso,
        ticketsPendientes,
        ticketsCerrados,
        ticketsCancelados,
        ticketsSinAsignar,
        ticketsReabiertos,
        totalReaperturas,
        ticketsConEtiquetaInstalacion,
        slaGlobal,
        slaRows,
        tecnicoRows,
      });

      this.buildDetalleTicketsSheet(detalle, ticketsRaw);

      this.buildTecnicosSheet(tecnicosSheet, tecnicoRows);

      this.buildPrioridadesSheet(prioridadesSheet, slaRows);

      const buff = await workbook.xlsx.writeBuffer();
      return Buffer.from(buff);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaGenerateReports.ticketsDailyReport',
      );
    }
  }

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

  // METRICAS DE TICKETS
  private resolveTicketReportDateRange(dto: QueryTicketsDailyReportDto) {
    const fechaUnica = dto.fecha;

    const startInput =
      fechaUnica ?? dto.fechaInicio ?? this.formatDateInput(new Date());

    const endInput =
      fechaUnica ??
      dto.fechaFin ??
      dto.fechaInicio ??
      this.formatDateInput(new Date());

    const start = this.dateFromYmd(startInput, 0, 0, 0, 0);
    const end = this.dateFromYmd(endInput, 23, 59, 59, 999);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Fecha inválida para reporte de tickets');
    }

    if (end < start) {
      throw new BadRequestException(
        'La fecha final no puede ser menor que la fecha inicial',
      );
    }

    return {
      start,
      end,
      label:
        startInput === endInput ? startInput : `${startInput} al ${endInput}`,
    };
  }

  private buildTicketDateWhere(
    modoFecha: QueryTicketsDailyReportDto['modoFecha'],
    start: Date,
    end: Date,
  ): Prisma.TicketSoporteWhereInput {
    const range = {
      gte: start,
      lte: end,
    };

    switch (modoFecha) {
      case 'APERTURA':
        return {
          fechaApertura: range,
        };

      case 'CIERRE':
        return {
          OR: [{ fechaCierre: range }, { fechaResolucionTecnico: range }],
        };

      case 'ACTUALIZACION':
        return {
          actualizadoEn: range,
        };

      case 'ACTIVIDAD':
      default:
        return {
          OR: [
            { fechaApertura: range },
            { fechaCierre: range },
            { fechaResolucionTecnico: range },
            { actualizadoEn: range },
            {
              SeguimientoTicket: {
                some: {
                  fechaRegistro: range,
                },
              },
            },
            {
              asignaciones: {
                some: {
                  creadoEn: range,
                },
              },
            },
          ],
        };
    }
  }

  private dateFromYmd(
    value: string,
    hours: number,
    minutes: number,
    seconds: number,
    milliseconds: number,
  ) {
    const onlyDate = value.split('T')[0];
    const [year, month, day] = onlyDate.split('-').map(Number);

    return new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds,
      milliseconds,
    );
  }

  private formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDateTime(date?: Date | null) {
    if (!date) return 'N/A';

    return new Intl.DateTimeFormat('es-GT', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private minutesBetween(start?: Date | null, end?: Date | null) {
    if (!start || !end) return null;

    const diff = end.getTime() - start.getTime();

    if (diff < 0) return null;

    return Math.round(diff / 1000 / 60);
  }

  private minutesToHours(minutes?: number | null) {
    if (minutes === null || minutes === undefined) return null;
    return Number((minutes / 60).toFixed(2));
  }

  private getTicketResolutionMinutes(ticket: any) {
    if (
      ticket.resumen?.tiempoTotalMinutos !== null &&
      ticket.resumen?.tiempoTotalMinutos !== undefined
    ) {
      return ticket.resumen.tiempoTotalMinutos;
    }

    return this.minutesBetween(
      ticket.fechaApertura,
      ticket.fechaCierre ?? ticket.fechaResolucionTecnico,
    );
  }

  private getTicketTechnicalMinutes(ticket: any) {
    if (
      ticket.resumen?.tiempoTecnicoMinutos !== null &&
      ticket.resumen?.tiempoTecnicoMinutos !== undefined
    ) {
      return ticket.resumen.tiempoTecnicoMinutos;
    }

    return this.minutesBetween(
      ticket.fechaInicioAtencion,
      ticket.fechaResolucionTecnico ?? ticket.fechaCierre,
    );
  }

  private average(values: number[]) {
    if (!values.length) return null;

    const total = values.reduce((acc, value) => acc + value, 0);
    return Number((total / values.length).toFixed(2));
  }

  private percent(part: number, total: number) {
    if (!total) return null;
    return Number(((part / total) * 100).toFixed(2));
  }

  private buildSlaRowsByPriority(tickets: any[]) {
    const slaByPriority: Record<PrioridadTicketSoporte, number> = {
      [PrioridadTicketSoporte.URGENTE]: 4,
      [PrioridadTicketSoporte.ALTA]: 8,
      [PrioridadTicketSoporte.MEDIA]: 24,
      [PrioridadTicketSoporte.BAJA]: 48,
    };

    return this.priorityOrder.map((priority) => {
      const priorityTickets = tickets.filter((t) => t.prioridad === priority);

      const closedTickets = priorityTickets.filter((t) =>
        this.closedTicketStates.includes(t.estado),
      );

      const resolutionMinutes = closedTickets
        .map((t) => this.getTicketResolutionMinutes(t))
        .filter((v): v is number => v !== null && v !== undefined);

      const resolutionHours = resolutionMinutes.map((m) =>
        Number((m / 60).toFixed(2)),
      );

      const slaHours = slaByPriority[priority];

      const ticketsWithSlaData = resolutionHours.length;

      const cumpleSla = resolutionHours.filter((hrs) => hrs <= slaHours).length;

      return {
        prioridad: priority,
        slaHoras: slaHours,
        totalTickets: priorityTickets.length,
        ticketsCerrados: closedTickets.length,
        promedioHoras: this.average(resolutionHours),
        minHoras: resolutionHours.length ? Math.min(...resolutionHours) : null,
        maxHoras: resolutionHours.length ? Math.max(...resolutionHours) : null,
        cumpleSla,
        ticketsConTiempo: ticketsWithSlaData,
        porcentajeCumpleSla: this.percent(cumpleSla, ticketsWithSlaData),
      };
    });
  }

  private calculateGlobalSlaPercent(tickets: any[]) {
    const slaRows = this.buildSlaRowsByPriority(tickets);

    const totalCumple = slaRows.reduce((acc, row) => acc + row.cumpleSla, 0);

    const totalConTiempo = slaRows.reduce(
      (acc, row) => acc + row.ticketsConTiempo,
      0,
    );

    return this.percent(totalCumple, totalConTiempo);
  }

  private buildTecnicoPerformanceRows(
    tickets: any[],
    isClosed: (estado: EstadoTicketSoporte) => boolean,
  ) {
    const map = new Map<
      number,
      {
        tecnicoId: number;
        tecnico: string;
        totalAsignados: number;
        cerrados: number;
        enProceso: number;
        pendientes: number;
        reaperturas: number;
        minutosTecnicos: number[];
        conformes: number;
        boletas: number;
        ticketIds: Set<number>;
        cerradosIds: Set<number>;
      }
    >();

    const ensureTecnico = (tecnicoId: number, tecnico: string) => {
      if (!map.has(tecnicoId)) {
        map.set(tecnicoId, {
          tecnicoId,
          tecnico,
          totalAsignados: 0,
          cerrados: 0,
          enProceso: 0,
          pendientes: 0,
          reaperturas: 0,
          minutosTecnicos: [],
          conformes: 0,
          boletas: 0,
          ticketIds: new Set<number>(),
          cerradosIds: new Set<number>(),
        });
      }

      return map.get(tecnicoId)!;
    };

    for (const ticket of tickets) {
      const asignaciones = ticket.asignaciones ?? [];

      if (asignaciones.length > 0) {
        for (const asignacion of asignaciones) {
          const tecnicoId = asignacion.tecnicoId;
          const tecnicoNombre =
            asignacion.tecnico?.nombre ?? `Técnico ${tecnicoId}`;

          const row = ensureTecnico(tecnicoId, tecnicoNombre);

          if (!row.ticketIds.has(ticket.id)) {
            row.ticketIds.add(ticket.id);
            row.totalAsignados += 1;

            if (ticket.estado === EstadoTicketSoporte.EN_PROCESO) {
              row.enProceso += 1;
            }

            if (this.pendingTicketStates.includes(ticket.estado)) {
              row.pendientes += 1;
            }

            row.reaperturas += ticket.resumen?.numeroReaperturas ?? 0;

            if (ticket.boleta) {
              row.boletas += 1;

              if (ticket.boleta.conforme) {
                row.conformes += 1;
              }
            }
          }

          const responsable =
            asignacion.esResponsable ||
            ticket.tecnicoId === tecnicoId ||
            asignaciones.length === 1;

          if (
            isClosed(ticket.estado) &&
            responsable &&
            !row.cerradosIds.has(ticket.id)
          ) {
            row.cerradosIds.add(ticket.id);
            row.cerrados += 1;
          }

          const minutosAsignacion =
            asignacion.tiempoTecnicoMinutos ??
            this.sumTicketLogMinutesByTecnico(ticket, tecnicoId);

          if (minutosAsignacion !== null && minutosAsignacion !== undefined) {
            row.minutosTecnicos.push(minutosAsignacion);
          }
        }

        continue;
      }

      if (ticket.tecnico) {
        const tecnicoId = ticket.tecnico.id;
        const row = ensureTecnico(tecnicoId, ticket.tecnico.nombre);

        if (!row.ticketIds.has(ticket.id)) {
          row.ticketIds.add(ticket.id);
          row.totalAsignados += 1;

          if (ticket.estado === EstadoTicketSoporte.EN_PROCESO) {
            row.enProceso += 1;
          }

          if (this.pendingTicketStates.includes(ticket.estado)) {
            row.pendientes += 1;
          }

          row.reaperturas += ticket.resumen?.numeroReaperturas ?? 0;

          if (ticket.boleta) {
            row.boletas += 1;

            if (ticket.boleta.conforme) {
              row.conformes += 1;
            }
          }
        }

        if (isClosed(ticket.estado) && !row.cerradosIds.has(ticket.id)) {
          row.cerradosIds.add(ticket.id);
          row.cerrados += 1;
        }

        const minutos =
          this.sumTicketLogMinutesByTecnico(ticket, tecnicoId) ??
          this.getTicketTechnicalMinutes(ticket);

        if (minutos !== null && minutos !== undefined) {
          row.minutosTecnicos.push(minutos);
        }
      }
    }

    return Array.from(map.values())
      .map((row) => {
        const promedioMin = this.average(row.minutosTecnicos);

        return {
          tecnicoId: row.tecnicoId,
          tecnico: row.tecnico,
          totalAsignados: row.totalAsignados,
          cerrados: row.cerrados,
          enProceso: row.enProceso,
          pendientes: row.pendientes,
          reaperturas: row.reaperturas,
          promedioHoras:
            promedioMin !== null ? Number((promedioMin / 60).toFixed(2)) : null,
          porcentajeConforme: this.percent(row.conformes, row.boletas),
        };
      })
      .sort((a, b) => b.totalAsignados - a.totalAsignados);
  }

  private sumTicketLogMinutesByTecnico(ticket: any, tecnicoId: number) {
    const logs =
      ticket.logsTiempo?.filter((log) => log.tecnicoId === tecnicoId) ?? [];

    if (!logs.length) return null;

    const total = logs.reduce((acc, log) => {
      if (log.duracionMinutos !== null && log.duracionMinutos !== undefined) {
        return acc + log.duracionMinutos;
      }

      const calculated = this.minutesBetween(log.inicio, log.fin);
      return acc + (calculated ?? 0);
    }, 0);

    return total || null;
  }

  private buildDashboardSheet(
    ws: ExcelJS.Worksheet,
    data: {
      label: string;
      generatedAt: Date;
      totalTickets: number;
      ticketsAbiertos: number;
      ticketsEnProceso: number;
      ticketsPendientes: number;
      ticketsCerrados: number;
      ticketsCancelados: number;
      ticketsSinAsignar: number;
      ticketsReabiertos: number;
      totalReaperturas: number;
      ticketsConEtiquetaInstalacion: number;
      slaGlobal: number | null;
      slaRows: any[];
      tecnicoRows: any[];
    },
  ) {
    ws.columns = [
      { width: 22 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
      { width: 18 },
    ];

    ws.mergeCells('A1:H1');
    ws.getCell('A1').value = 'REPORTE DIARIO DE TICKETS';
    ws.getCell('A1').font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 16,
    };
    ws.getCell('A1').alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    ws.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F3A5F' },
    };
    ws.getRow(1).height = 30;

    ws.mergeCells('A2:H2');
    ws.getCell('A2').value =
      `Periodo: ${data.label}  |  Generado: ${this.formatDateTime(
        data.generatedAt,
      )}`;
    ws.getCell('A2').font = {
      italic: true,
      color: { argb: 'FFFFFFFF' },
    };
    ws.getCell('A2').alignment = {
      horizontal: 'center',
      vertical: 'middle',
    };
    ws.getCell('A2').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0EA5E9' },
    };

    const kpiHeaders = [
      'Total',
      'Abiertos',
      'En Proceso',
      'Pendientes',
      'Cerrados',
      'Cancelados',
      'Sin Asignar',
      'SLA Global',
    ];

    const kpiValues = [
      data.totalTickets,
      data.ticketsAbiertos,
      data.ticketsEnProceso,
      data.ticketsPendientes,
      data.ticketsCerrados,
      data.ticketsCancelados,
      data.ticketsSinAsignar,
      data.slaGlobal !== null ? `${data.slaGlobal}%` : '-',
    ];

    ws.getRow(4).values = kpiHeaders;
    ws.getRow(5).values = kpiValues;

    this.styleHeaderRow(ws.getRow(4), 'FF2563EB');
    this.styleKpiRow(ws.getRow(5));

    ws.getRow(7).values = ['SLA POR PRIORIDAD'];
    ws.mergeCells('A7:H7');
    this.styleSectionTitle(ws.getCell('A7'));

    ws.getRow(8).values = [
      'Prioridad',
      'SLA hrs',
      'Total',
      'Cerrados',
      'Promedio hrs',
      'Min hrs',
      'Máx hrs',
      '% Cumple SLA',
    ];
    this.styleHeaderRow(ws.getRow(8), 'FF2563EB');

    let rowIndex = 9;

    for (const row of data.slaRows) {
      ws.getRow(rowIndex).values = [
        row.prioridad,
        row.slaHoras,
        row.totalTickets,
        row.ticketsCerrados,
        row.promedioHoras ?? '-',
        row.minHoras ?? '-',
        row.maxHoras ?? '-',
        row.porcentajeCumpleSla !== null ? `${row.porcentajeCumpleSla}%` : '-',
      ];

      this.styleBodyRow(ws.getRow(rowIndex));

      rowIndex++;
    }

    rowIndex += 2;

    ws.getRow(rowIndex).values = ['RENDIMIENTO POR TÉCNICO'];
    ws.mergeCells(`A${rowIndex}:H${rowIndex}`);
    this.styleSectionTitle(ws.getCell(`A${rowIndex}`));

    rowIndex++;

    ws.getRow(rowIndex).values = [
      'Técnico',
      'Asignados',
      'Cerrados',
      'En Proceso',
      'Pendientes',
      'Reaperturas',
      'Promedio hrs',
      '% Conforme',
    ];
    this.styleHeaderRow(ws.getRow(rowIndex), 'FF2563EB');

    rowIndex++;

    for (const row of data.tecnicoRows.slice(0, 12)) {
      ws.getRow(rowIndex).values = [
        row.tecnico,
        row.totalAsignados,
        row.cerrados,
        row.enProceso,
        row.pendientes,
        row.reaperturas,
        row.promedioHoras ?? '-',
        row.porcentajeConforme !== null ? `${row.porcentajeConforme}%` : '-',
      ];

      this.styleBodyRow(ws.getRow(rowIndex));

      rowIndex++;
    }

    rowIndex += 2;

    ws.getRow(rowIndex).values = ['ALERTAS'];
    ws.mergeCells(`A${rowIndex}:H${rowIndex}`);
    this.styleSectionTitle(ws.getCell(`A${rowIndex}`), 'FFDC2626');

    rowIndex++;

    const alerts = [
      ['Tickets sin asignar abiertos', data.ticketsSinAsignar],
      ['Tickets con reapertura', data.ticketsReabiertos],
      ['Total de reaperturas acumuladas', data.totalReaperturas],
      ['Tickets con etiqueta instalación', data.ticketsConEtiquetaInstalacion],
      [
        'Tasa de reapertura',
        data.totalTickets
          ? `${this.percent(data.ticketsReabiertos, data.totalTickets)}%`
          : '-',
      ],
      [
        'SLA global cumplido',
        data.slaGlobal !== null ? `${data.slaGlobal}%` : '-',
      ],
    ];

    for (const alert of alerts) {
      ws.mergeCells(`A${rowIndex}:D${rowIndex}`);
      ws.mergeCells(`E${rowIndex}:H${rowIndex}`);

      ws.getCell(`A${rowIndex}`).value = alert[0];
      ws.getCell(`E${rowIndex}`).value = alert[1];

      ws.getCell(`A${rowIndex}`).font = { bold: true };
      ws.getCell(`E${rowIndex}`).font = { bold: true, size: 13 };
      ws.getCell(`E${rowIndex}`).alignment = { horizontal: 'center' };

      this.applyThinBorder(ws.getRow(rowIndex));

      rowIndex++;
    }
  }

  private buildDetalleTicketsSheet(ws: ExcelJS.Worksheet, tickets: any[]) {
    ws.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Estado', key: 'estado', width: 18 },
      { header: 'Prioridad', key: 'prioridad', width: 14 },
      { header: 'Cliente', key: 'cliente', width: 35 },
      { header: 'Teléfono', key: 'telefono', width: 16 },
      { header: 'Dirección', key: 'direccion', width: 45 },
      { header: 'Sector', key: 'sector', width: 20 },
      { header: 'Técnico Principal', key: 'tecnicoPrincipal', width: 25 },
      { header: 'Técnicos Asignados', key: 'tecnicosAsignados', width: 40 },
      { header: 'Creado Por', key: 'creadoPor', width: 25 },
      { header: 'Fecha Apertura', key: 'fechaApertura', width: 20 },
      { header: 'Fecha Asignación', key: 'fechaAsignacion', width: 20 },
      { header: 'Inicio Atención', key: 'fechaInicioAtencion', width: 20 },
      {
        header: 'Resolución Técnico',
        key: 'fechaResolucionTecnico',
        width: 22,
      },
      { header: 'Fecha Cierre', key: 'fechaCierre', width: 20 },
      { header: 'Tiempo Total hrs', key: 'tiempoTotalHrs', width: 18 },
      { header: 'Tiempo Técnico hrs', key: 'tiempoTecnicoHrs', width: 20 },
      { header: 'Reabierto', key: 'reabierto', width: 12 },
      { header: 'No. Reaperturas', key: 'numeroReaperturas', width: 18 },
      { header: 'Boleta Conforme', key: 'boletaConforme', width: 18 },
      { header: 'Seguimientos', key: 'seguimientos', width: 14 },
      { header: 'Etiquetas', key: 'etiquetas', width: 35 },
      { header: 'Solución', key: 'solucion', width: 25 },
      { header: 'Título', key: 'titulo', width: 40 },
      { header: 'Descripción', key: 'descripcion', width: 60 },
    ];

    this.styleHeaderRow(ws.getRow(1), 'FF1D4ED8');

    for (const ticket of tickets) {
      const clienteNombre = ticket.cliente
        ? `${ticket.cliente.nombre ?? ''} ${ticket.cliente.apellidos ?? ''}`.trim()
        : 'N/A';

      const tecnicosAsignados =
        ticket.asignaciones?.length > 0
          ? ticket.asignaciones
              .map((a) =>
                a.esResponsable
                  ? `${a.tecnico?.nombre ?? 'N/A'} (Responsable)`
                  : (a.tecnico?.nombre ?? 'N/A'),
              )
              .join(', ')
          : 'N/A';

      const etiquetas =
        ticket.etiquetas?.length > 0
          ? ticket.etiquetas.map((e) => e.etiqueta.nombre).join(', ')
          : 'N/A';

      const tiempoTotalMin = this.getTicketResolutionMinutes(ticket);
      const tiempoTecnicoMin = this.getTicketTechnicalMinutes(ticket);

      ws.addRow({
        id: ticket.id,
        estado: ticket.estado,
        prioridad: ticket.prioridad,
        cliente: clienteNombre || 'N/A',
        telefono: ticket.cliente?.telefono ?? 'N/A',
        direccion: ticket.cliente?.direccion ?? 'N/A',
        sector: ticket.cliente?.sector?.nombre ?? 'N/A',
        tecnicoPrincipal: ticket.tecnico?.nombre ?? 'Sin asignar',
        tecnicosAsignados,
        creadoPor: ticket.creadoPor?.nombre ?? 'N/A',
        fechaApertura: ticket.fechaApertura,
        fechaAsignacion: ticket.fechaAsignacion,
        fechaInicioAtencion: ticket.fechaInicioAtencion,
        fechaResolucionTecnico: ticket.fechaResolucionTecnico,
        fechaCierre: ticket.fechaCierre,
        tiempoTotalHrs: this.minutesToHours(tiempoTotalMin) ?? '-',
        tiempoTecnicoHrs: this.minutesToHours(tiempoTecnicoMin) ?? '-',
        reabierto: ticket.resumen?.reabierto ? 'Sí' : 'No',
        numeroReaperturas: ticket.resumen?.numeroReaperturas ?? 0,
        boletaConforme:
          ticket.boleta?.conforme === true
            ? 'Sí'
            : ticket.boleta?.conforme === false
              ? 'No'
              : 'N/A',
        seguimientos: ticket._count?.SeguimientoTicket ?? 0,
        etiquetas,
        solucion: ticket.resumen?.solucion?.solucion ?? 'N/A',
        titulo: ticket.titulo ?? 'N/A',
        descripcion: ticket.descripcion ?? 'N/A',
      });
    }

    ws.autoFilter = {
      from: 'A1',
      to: 'Y1',
    };

    ws.getColumn('K').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('L').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('M').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('N').numFmt = 'dd/mm/yyyy hh:mm';
    ws.getColumn('O').numFmt = 'dd/mm/yyyy hh:mm';

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        this.styleBodyRow(row);
      }
    });
  }

  private buildTecnicosSheet(ws: ExcelJS.Worksheet, rows: any[]) {
    ws.columns = [
      { header: 'Técnico', key: 'tecnico', width: 30 },
      { header: 'Total Asignados', key: 'totalAsignados', width: 18 },
      { header: 'Cerrados', key: 'cerrados', width: 14 },
      { header: 'En Proceso', key: 'enProceso', width: 14 },
      { header: 'Pendientes', key: 'pendientes', width: 14 },
      { header: 'Reaperturas', key: 'reaperturas', width: 14 },
      { header: 'Promedio Hrs', key: 'promedioHoras', width: 16 },
      { header: '% Conforme', key: 'porcentajeConforme', width: 16 },
    ];

    this.styleHeaderRow(ws.getRow(1), 'FF1D4ED8');

    for (const row of rows) {
      ws.addRow({
        tecnico: row.tecnico,
        totalAsignados: row.totalAsignados,
        cerrados: row.cerrados,
        enProceso: row.enProceso,
        pendientes: row.pendientes,
        reaperturas: row.reaperturas,
        promedioHoras: row.promedioHoras ?? '-',
        porcentajeConforme:
          row.porcentajeConforme !== null ? `${row.porcentajeConforme}%` : '-',
      });
    }

    ws.autoFilter = {
      from: 'A1',
      to: 'H1',
    };

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        this.styleBodyRow(row);
      }
    });
  }

  private buildPrioridadesSheet(ws: ExcelJS.Worksheet, rows: any[]) {
    ws.columns = [
      { header: 'Prioridad', key: 'prioridad', width: 18 },
      { header: 'SLA hrs', key: 'slaHoras', width: 12 },
      { header: 'Total Tickets', key: 'totalTickets', width: 16 },
      { header: 'Tickets Cerrados', key: 'ticketsCerrados', width: 18 },
      { header: 'Promedio hrs', key: 'promedioHoras', width: 16 },
      { header: 'Min hrs', key: 'minHoras', width: 12 },
      { header: 'Máx hrs', key: 'maxHoras', width: 12 },
      { header: 'Cumplen SLA', key: 'cumpleSla', width: 14 },
      { header: 'Con Tiempo', key: 'ticketsConTiempo', width: 14 },
      { header: '% Cumple SLA', key: 'porcentajeCumpleSla', width: 16 },
    ];

    this.styleHeaderRow(ws.getRow(1), 'FF1D4ED8');

    for (const row of rows) {
      ws.addRow({
        prioridad: row.prioridad,
        slaHoras: row.slaHoras,
        totalTickets: row.totalTickets,
        ticketsCerrados: row.ticketsCerrados,
        promedioHoras: row.promedioHoras ?? '-',
        minHoras: row.minHoras ?? '-',
        maxHoras: row.maxHoras ?? '-',
        cumpleSla: row.cumpleSla,
        ticketsConTiempo: row.ticketsConTiempo,
        porcentajeCumpleSla:
          row.porcentajeCumpleSla !== null
            ? `${row.porcentajeCumpleSla}%`
            : '-',
      });
    }

    ws.autoFilter = {
      from: 'A1',
      to: 'J1',
    };

    ws.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        this.styleBodyRow(row);
      }
    });
  }

  private styleHeaderRow(row: ExcelJS.Row, color = 'FF2563EB') {
    row.height = 22;

    row.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: color },
      };

      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true,
      };

      cell.border = this.thinBorder();
    });
  }

  private styleKpiRow(row: ExcelJS.Row) {
    row.height = 34;

    row.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 16,
        color: { argb: 'FF1E3A8A' },
      };

      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFEFF6FF' },
      };

      cell.border = this.thinBorder();
    });
  }

  private styleSectionTitle(cell: ExcelJS.Cell, color = 'FF1F3A5F') {
    cell.font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 12,
    };

    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color },
    };

    cell.alignment = {
      horizontal: 'left',
      vertical: 'middle',
    };

    cell.border = this.thinBorder();
  }

  private styleBodyRow(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.alignment = {
        vertical: 'middle',
        wrapText: true,
      };

      cell.border = this.thinBorder();
    });
  }

  private applyThinBorder(row: ExcelJS.Row) {
    row.eachCell((cell) => {
      cell.border = this.thinBorder();
    });
  }

  private thinBorder(): Partial<ExcelJS.Borders> {
    return {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
    };
  }
}
