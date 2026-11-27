import { Injectable } from '@nestjs/common';
import { ZonaFacturacionFacadePort } from '../../public/zona-facturacion.facade.port';
import { VerificarZonaFacturacionAsignableUseCase } from '../use-cases/verificar-zona-facturacion-asignable.use-case';

@Injectable()
export class ZonaFacturacionFacade implements ZonaFacturacionFacadePort {
  constructor(
    private readonly verificar: VerificarZonaFacturacionAsignableUseCase,
  ) {}

  verificarAsignable(zonaId: number): Promise<void> {
    return this.verificar.execute(zonaId);
  }
}
