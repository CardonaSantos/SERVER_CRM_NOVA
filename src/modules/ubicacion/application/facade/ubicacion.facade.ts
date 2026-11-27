import { Injectable } from '@nestjs/common';
import {
  UbicacionFacadePort,
  VerificarUbicacionInput,
} from '../../public/ubicacion.facade.port';
import { VerificarUbicacionAsignadaUseCase } from '../use-cases/verificar-ubicacion-asignada.use-case';

@Injectable()
export class UbicacionFacade implements UbicacionFacadePort {
  constructor(private readonly verificar: VerificarUbicacionAsignadaUseCase) {}

  verificarAsignacion(input: VerificarUbicacionInput): Promise<void> {
    return this.verificar.execute(input);
  }
}
