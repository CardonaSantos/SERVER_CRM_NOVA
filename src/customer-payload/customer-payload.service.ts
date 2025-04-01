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
    const r = router.toLowerCase();

    switch (true) {
      case r.includes('corte 5') ||
        r.includes('san antonio corte 5') ||
        r.includes('jacaltenango corte5'):
        return 8;

      case r.includes('corte 10') ||
        r.includes('san antonio corte 10') ||
        r.includes('jacaltenango corte10'):
        return 16;

      case r.includes('corte 15') ||
        r.includes('san antonio corte 15') ||
        r.includes('jacaltenango corte15'):
        return 18;

      case r.includes('corte 20') ||
        r.includes('san antonio corte 20') ||
        r.includes('jacaltenango corte20'):
        return 19;

      case r.includes('corte 16') || r.includes('jacaltenango corte16'):
        return 22;

      case r.includes('corte 30') ||
        r.includes('san antonio corte 30') ||
        r.includes('jacaltenango corte30'):
        return 25;

      default:
        return 8; // Por defecto: CORTE 5
    }
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
        servicioWifiId:
          plan === 'Plan Basico Q150' ? 3 : plan === 'Avanzado Q200' ? 4 : 5,

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

    const chunks = chunkArray(clientesFormateados.slice(0, 50), 10);
    for (const chunk of chunks) {
      await Promise.all(
        chunk.map((cliente) => this.clienteInternetService.create(cliente)),
      );
    }

    console.log('Clientes añadidos');

    // Mostrar los primeros 10
    // console.log('📦 Primeros 10 clientes formateados:\n');
    // console.dir(clientesFormateados.slice(0, 10), { depth: null });
  }
}
