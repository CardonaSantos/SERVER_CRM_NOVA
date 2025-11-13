import { Injectable } from '@nestjs/common';
import { CreateCustomerPayloadDto } from './dto/create-customer-payload.dto';
import * as ExcelJS from 'exceljs';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInternetService } from 'src/cliente-internet/cliente-internet.service';
import * as csv from 'csvtojson';
import * as dayjs from 'dayjs';
import { periodoFrom } from 'src/facturacion/Utils';

@Injectable()
export class CustomerPayloadService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly clienteInternetService: ClienteInternetService,
  ) {}

  asignarZonaPorRouter(router: string): number {
    const nombreNormalizado = router.trim().toLowerCase();

    const zonas = new Map<string, number>([
      ['san antonio corte 30', 1],
      ['san antonio corte 20', 2],
      ['san antonio corte 25', 3],
      ['san antonio corte 15', 4],
      ['san antonio corte 10', 5],
      ['san antonio corte 5', 6],
      ['router san antonio corte', 7],
      ['router san antonio', 8],
      ['jacaltenango corte5', 9],
      ['jacaltenango corte10', 10],
      ['jacaltenango corte15', 11],
      ['jacaltenango corte20', 12],
      ['jacaltenango corte25', 13],
      ['jacaltenango corte30', 14],
      ['jacaltenango corte1', 15],
      ['generico', 16],
    ]);

    for (const [clave, id] of zonas.entries()) {
      if (nombreNormalizado.includes(clave)) {
        return id;
      }
    }

    return 16; // valor por defecto
  }

  asignarServicioWifi(plan: string): number {
    const nombre = plan.trim().toLowerCase();

    const servicios = new Map<string, number>([
      ['plan basico q150', 1],
      ['avanzado q200', 2],
      ['plan premium q300', 3],
      ['3m/3m', 4],
      ['50m/50m', 5],
      ['plan basico 2 q175', 6],
      ['plan gratis', 7],
      ['13m/3m', 8],
      ['6500k/6500k', 9],
      ['5m/4m', 10],
      ['8m/4m', 11],
      ['10m/10m', 12],
      ['8m/8m', 13],
    ]);

    for (const [clave, id] of servicios.entries()) {
      if (nombre.includes(clave)) {
        return id;
      }
    }

    return 14; // valor por defecto (
  }

  async importarYFormatearClientes(rutaArchivo: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(rutaArchivo);
    const worksheet = workbook.getWorksheet(1); // primera hoja (sin nombre específico)

    if (!worksheet) throw new Error('No se pudo leer la hoja del Excel.');

    const clientesFormateados = [];

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // saltar encabezadod

      const nombreCompleto = row.getCell(3).text.trim(); // Columna A: Nombre
      const ip = row.getCell(5).text.trim(); // Columna C: IP
      const estado = row.getCell(6).text.trim().toUpperCase(); // Columna D: Estado
      const plan = row.getCell(7).text.trim(); // Columna E: Plan Internet
      const router = row.getCell(8).text.trim(); // Columna F: Router
      const direccion = row.getCell(9).text.trim(); // Columna G: Dirección
      const telefono = row.getCell(11).text.trim(); // Columna G: Dirección

      // Separar nombre y apellidos (simplemente por el último espacio)
      const partesNombre = nombreCompleto.split(' ');
      const nombre = partesNombre.slice(0, -1).join(' ');
      const apellidos = partesNombre.slice(-1).join(' ');

      const clienteDto = {
        nombre,
        apellidos,
        ip,
        telefono: telefono,
        estadoCliente: estado === 'ACTIVO' ? 'ACTIVO' : 'SUSPENDIDO',

        direccion,
        dpi: '',
        observaciones: '',
        contactoReferenciaNombre: '',
        contactoReferenciaTelefono: '',
        contrasenaWifi: '',
        ssidRouter: plan, // usamos el nombre del plan como nombre de red por ahora
        fechaInstalacion: null,
        asesorId: null,
        servicesIds: [],
        servicioWifiId: this.asignarServicioWifi(plan),

        municipioId: 97,
        departamentoId: 8,
        coordenadas: [],
        empresaId: 1,
        // serviceId: null,
        zonaFacturacionId: this.asignarZonaPorRouter(router),
        // clienteId: 0,
        idContrato: '',
        fechaFirma: '',
        archivoContrato: '',
        observacionesContrato: '',
      };

      clientesFormateados.push(clienteDto);
    });

    function chunkArray<T>(arr: T[], size: number): T[][] {
      return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size),
      );
    }

    // const chunks = chunkArray(clientesFormateados, 10);
    for (const cliente of clientesFormateados) {
      try {
        const created = await this.clienteInternetService.create(cliente);
        // console.log('✅ Cliente creado:', created.cliente.nombre);
      } catch (error) {
        console.error(
          '❌ Error al crear cliente:',
          cliente.nombre,
          error.message,
        );
      }
    }

    console.log('Clientes añadidos');

    // Mostrar los primeros 10
    // console.log('📦 Primeros 10 clientes formateados:\n');
    // console.dir(clientesFormateados.slice(0, 10), { depth: null });
  }
  async getOrCreateSector(nombreSector: string, municipioId = 97) {
    const existing = await this.prisma.sector.findFirst({
      where: {
        nombre: { equals: nombreSector, mode: 'insensitive' },
      },
    });
    if (existing) return existing.id;

    const nuevo = await this.prisma.sector.create({
      data: {
        nombre: nombreSector,
        descripcion: 'Cargado desde CSV',
        municipioId,
      },
    });
    return nuevo.id;
  }

  async getOrCreateServicioInternet(precio: number, empresaId = 1) {
    const servicioExistente = await this.prisma.servicioInternet.findFirst({
      where: { precio },
    });
    if (servicioExistente) return servicioExistente;

    const nuevo = await this.prisma.servicioInternet.create({
      data: {
        nombre: `Plan Q${precio}`,
        velocidad: 'Desconocida',
        precio,
        estado: 'ACTIVO',
        empresa: { connect: { id: empresaId } },
      },
    });
    return nuevo;
  }

  async getOrCreateZonaFacturacion(nombreZona: string, empresaId = 1) {
    const existing = await this.prisma.facturacionZona.findFirst({
      where: {
        nombre: { equals: nombreZona, mode: 'insensitive' },
      },
    });
    if (existing) return existing.id;

    const nuevaZona = await this.prisma.facturacionZona.create({
      data: {
        nombre: nombreZona,
        empresaId,
        diaGeneracionFactura: 1,
        diaPago: 5,
        diaRecordatorio: 3,
        horaRecordatorio: '08:00',
        whatsapp: true,
        email: false,
        llamada: false,
        sms: false,
        telegram: false,
        diaCorte: 10,
        suspenderTrasFacturas: 2,
        diaSegundoRecordatorio: 7,
      },
    });
    return nuevaZona.id;
  }

  async generarFacturaConPago(
    mes: number,
    anio: number,
    clienteId: number,
    montoDesdeCSV: number,
    empresaId = 1,
  ) {
    const cliente = await this.prisma.clienteInternet.findUnique({
      where: { id: clienteId },
      select: {
        facturacionZona: { select: { id: true, diaPago: true } },
        id: true,
        nombre: true,
        apellidos: true,
        servicioInternet: {
          select: { id: true, nombre: true, velocidad: true, precio: true },
        },
        empresa: { select: { id: true, nombre: true } },
      },
    });

    const fechaPagoEsperada = dayjs()
      .month(mes - 1)
      .year(anio)
      .date(cliente.facturacionZona.diaPago)
      .tz('America/Guatemala', true)
      .startOf('day')
      .toDate();

    const detalleFactura = `Pago por suscripción mensual al servicio de internet, plan ${cliente.servicioInternet.nombre} (${cliente.servicioInternet.velocidad}), precio: ${cliente.servicioInternet.precio} Fecha: ${cliente.facturacionZona.diaPago} de ${dayjs(fechaPagoEsperada).format('MMMM YYYY')}`;

    const montoPagado = Math.min(
      montoDesdeCSV,
      cliente.servicioInternet.precio,
    );

    let estadoFactura: 'PAGADA' | 'PARCIAL' | 'PENDIENTE' = 'PENDIENTE';
    if (montoPagado >= cliente.servicioInternet.precio) {
      estadoFactura = 'PAGADA';
    } else if (montoPagado > 0) {
      estadoFactura = 'PARCIAL';
    }

    const periodo = periodoFrom(fechaPagoEsperada); // o la fecha que uses
    console.log('El periodo generando es: ', periodo);
    const factura = await this.prisma.facturaInternet.create({
      data: {
        periodo: periodo,
        creadoEn: new Date(),
        fechaPagoEsperada,
        montoPago: cliente.servicioInternet.precio,
        saldoPendiente: cliente.servicioInternet.precio - montoPagado,
        estadoFacturaInternet: estadoFactura,
        cliente: { connect: { id: cliente.id } },
        facturacionZona: { connect: { id: cliente.facturacionZona.id } },
        nombreClienteFactura: `${cliente.nombre} ${cliente.apellidos}`,
        detalleFactura,
        empresa: { connect: { id: empresaId } },
        fechaPagada: estadoFactura === 'PAGADA' ? new Date() : null,
      },
    });

    if (montoPagado > 0) {
      const pagoData: any = {
        cliente: { connect: { id: cliente.id } },
        montoPagado: montoPagado,
        facturaInternet: { connect: { id: factura.id } },
        metodoPago: 'EFECTIVO',
        fechaPago: new Date(),
      };

      await this.prisma.pagoFacturaInternet.create({
        data: pagoData,
      });

      await this.prisma.saldoCliente.updateMany({
        where: { clienteId },
        data: {
          saldoPendiente: { decrement: montoPagado },
          totalPagos: { increment: montoPagado },
          ultimoPago: new Date(),
        },
      });
    }

    return factura;
  }

  async importarClientesDesdeCSV(rutaArchivo: string): Promise<void> {
    try {
      const rows = await csv().fromFile(rutaArchivo);
      let creados = 0;
      let total = rows.length;

      for (const row of rows) {
        try {
          // Acceder a todas las propiedades con claves en mayúsculas
          const nombreCompleto = (row['NOMBRE Y APELLIDO'] || '').trim();

          if (!nombreCompleto) {
            console.warn('⚠️ Fila omitida por falta de nombre completo.');
            continue;
          }

          const tokens = nombreCompleto.split(' ').filter(Boolean);
          const nombre = tokens.slice(0, 2).join(' ');
          const apellidos = tokens.length > 2 ? tokens.slice(2).join(' ') : '';

          const observaciones = [row['COMENTARIOS']]
            .filter(Boolean)
            .map((x) => x.trim())
            .join(' ');

          let fechaInstalacion: Date | null = null;
          const fechaRaw = row['FECHA DE INSTALACION'];
          if (fechaRaw) {
            if (!isNaN(Number(fechaRaw))) {
              const serial = parseInt(fechaRaw);
              fechaInstalacion = this.excelDateToJSDate(serial);
            } else {
              const posibleFecha = new Date(fechaRaw);
              if (!isNaN(posibleFecha.getTime())) {
                fechaInstalacion = posibleFecha;
              }
            }
          }

          const direccion = (row['RESIDENCIA'] || '').trim();

          let ubicacion = undefined;
          if (row['COORDENADAS']?.includes(',')) {
            const parts = row['COORDENADAS'].split(',');
            const lat = parseFloat(parts[0]?.trim());
            const lng = parseFloat(parts[1]?.trim());
            if (!isNaN(lat) && !isNaN(lng)) {
              ubicacion = { lat, lng };
            }
          }

          const nombreSector = (row['LUGAR'] || '').trim().toLowerCase();
          const sectorId = await this.getOrCreateSector(nombreSector);

          const telefono = (row['TELEFONO'] || '').trim();
          const contactoReferenciaTelefono = (
            row['CONTACTO REFERENCIA'] || ''
          ).trim();

          // const precioPlan = parseFloat(row['PLAN'] || '0');

          const rawPlan = row['PLAN'] || '';
          const precioPlan = parseFloat(rawPlan);

          if (isNaN(precioPlan)) {
            console.warn(`⚠️ Fila omitida por plan inválido: "${rawPlan}"`);
            continue;
          }

          const servicioInternet =
            await this.getOrCreateServicioInternet(precioPlan);

          const nombreZona = (row['ZONA DE CORTE'] || '').trim();
          const facturacionZonaId =
            await this.getOrCreateZonaFacturacion(nombreZona);

          const dpi = (row['DPI'] || '').trim();

          const estadoRaw = (row['ESTADO'] || '').toUpperCase();
          const estadoCliente = [
            'ACTIVO',
            'PENDIENTE_ACTIVO',
            'PAGO_PENDIENTE',
            'MOROSO',
            'ATRASADO',
            'SUSPENDIDO',
            'DESINSTALADO',
            'EN_INSTALACION',
          ].includes(estadoRaw)
            ? estadoRaw
            : 'SUSPENDIDO';

          const facturas = {
            enero: row['ENERO'] || null,
            febrero: row['FEBRERO'] || null,
            marzo: row['MARZO'] || null,
            abril: row['ABRIL'] || null,
          };

          const clienteDto: any = {
            nombre,
            apellidos,
            telefono,
            direccion,
            dpi,
            observaciones,
            contactoReferenciaTelefono,
            estadoCliente,
            fechaInstalacion,
            asesorId: null,
            municipioId: 97,
            departamentoId: 8,
            empresaId: 1,
            servicioInternetId: servicioInternet.id,
            facturacionZonaId,
            sectorId,
          };

          const created = await this.prisma.clienteInternet.create({
            data: clienteDto,
          });
          creados++;

          if (ubicacion) {
            await this.prisma.ubicacion.create({
              data: {
                latitud: ubicacion.lat,
                longitud: ubicacion.lng,
                cliente: { connect: { id: created.id } },
                empresa: { connect: { id: 1 } },
              },
            });
          }

          let saldoPendiente = 0;
          let saldoFavor = 0;

          const meses = { enero: 1, febrero: 2, marzo: 3, abril: 4 };
          for (const [mes, index] of Object.entries(meses)) {
            const valor = facturas[mes];
            const esPendiente = !valor || valor.toString().trim() === '';
            const monto = esPendiente ? 0 : servicioInternet.precio;

            await this.generarFacturaConPago(index, 2025, created.id, monto);

            if (esPendiente) {
              saldoPendiente += servicioInternet.precio;
            } else {
              saldoFavor += servicioInternet.precio;
            }
          }

          await this.prisma.saldoCliente.create({
            data: {
              cliente: { connect: { id: created.id } },
              saldoPendiente,
              saldoFavor,
              totalPagos: saldoFavor,
              ultimoPago: saldoFavor > 0 ? new Date() : null,
            },
          });
        } catch (err) {
          console.error('❌ Error procesando fila:', err.message);
        }
      }

      console.log(
        `✔ Clientes del CSV procesados: ${creados}/${total} instalados correctamente.`,
      );
    } catch (error) {
      console.error('❌ Error leyendo el CSV:', error.message);
    }
  }

  excelDateToJSDate(serial: number): Date {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30)); // Excel starts from Dec 30, 1899
    return new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
  }
}
