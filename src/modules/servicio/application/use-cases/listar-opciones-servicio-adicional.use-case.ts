import { Inject, Injectable } from '@nestjs/common';
import {
  SERVICIO_ADICIONAL_QUERY,
  ServicioAdicionalQueryPort,
} from '../../domain/ports/servicio-adicional-query.port';
import { ServicioAdicionalOpcion } from '../../domain/read-models/servicio-adicional-listado.read-model';

@Injectable()
export class ListarOpcionesServicioAdicionalUseCase {
  constructor(
    @Inject(SERVICIO_ADICIONAL_QUERY)
    private readonly consulta: ServicioAdicionalQueryPort,
  ) {}

  execute(): Promise<ServicioAdicionalOpcion[]> {
    return this.consulta.findOpciones();
  }
}
