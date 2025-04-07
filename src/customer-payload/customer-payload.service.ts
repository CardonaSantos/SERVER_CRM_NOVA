import { Injectable } from '@nestjs/common';
import { CreateCustomerPayloadDto } from './dto/create-customer-payload.dto';
import * as ExcelJS from 'exceljs';
import { PrismaService } from 'src/prisma/prisma.service';
import { ClienteInternetService } from 'src/cliente-internet/cliente-internet.service';

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
}
