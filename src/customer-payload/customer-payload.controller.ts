import { Controller, Get } from '@nestjs/common';
import { CustomerPayloadService } from './customer-payload.service';

import { join } from 'path';

@Controller('customer-payload')
export class CustomerPayloadController {
  constructor(
    private readonly customerPayloadService: CustomerPayloadService,
  ) {}

  @Get('/importar-excel')
  async importarDesdeRutaLocal() {
    // const ruta = join(process.cwd(), 'assets', 'ClientesIntegrados.xlsx');

    const ruta = join(process.cwd(), 'src', 'assets', 'CLIENTES_CRM.xlsx');

    console.log('📂 Usando ruta:', ruta);
    return await this.customerPayloadService.importarYFormatearClientes(ruta);
  }

  // Ejemplo de controlador que usa la función:
  @Get('/importar-csv')
  async importarDesdeCSV() {
    const ruta = join(process.cwd(), 'src', 'assets', 'BASE_JACAL_NUEVA.csv');
    console.log('📂 Usando ruta:', ruta);
    return await this.customerPayloadService.importarClientesDesdeCSV(ruta);
  }
}
