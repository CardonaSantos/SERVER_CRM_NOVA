import { Injectable } from '@nestjs/common';
import { EstadoCobranzaCliente } from '../../../cliente-cobranza/public/cliente-cobranza.facade.port';
import {
  FacturacionFacadePort,
  GenerarPrimeraFacturaInput,
} from '../../public/facturacion.facade.port';
import { GenerarPrimeraFacturaUseCase } from '../use-cases/generar-primera-factura.use-case';

@Injectable()
export class FacturacionFacade implements FacturacionFacadePort {
  constructor(private readonly primeraFactura: GenerarPrimeraFacturaUseCase) {}

  generarPrimeraFactura(
    input: GenerarPrimeraFacturaInput,
  ): Promise<{ estadoCobranza: EstadoCobranzaCliente }> {
    return this.primeraFactura.execute(input);
  }
}
