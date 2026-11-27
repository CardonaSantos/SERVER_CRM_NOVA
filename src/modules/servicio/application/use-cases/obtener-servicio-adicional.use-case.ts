import { Inject, Injectable } from '@nestjs/common';
import { ServicioAdicionalNoEncontradoError } from '../../domain/errors/servicio.errors';
import {
  SERVICIO_ADICIONAL_QUERY,
  ServicioAdicionalQueryPort,
} from '../../domain/ports/servicio-adicional-query.port';
import { ServicioAdicionalListItem } from '../../domain/read-models/servicio-adicional-listado.read-model';

@Injectable()
export class ObtenerServicioAdicionalUseCase {
  constructor(
    @Inject(SERVICIO_ADICIONAL_QUERY)
    private readonly consulta: ServicioAdicionalQueryPort,
  ) {}

  async execute(servicioId: number): Promise<ServicioAdicionalListItem> {
    const servicio = await this.consulta.findDetail(servicioId);
    if (!servicio) throw new ServicioAdicionalNoEncontradoError();

    return servicio;
  }
}
