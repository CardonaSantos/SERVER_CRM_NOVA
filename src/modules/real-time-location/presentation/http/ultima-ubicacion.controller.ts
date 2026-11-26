import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListarUltimasUbicacionesUseCase } from '../../application/use-cases/listar-ultimas-ubicaciones.use-case';
import { UltimaUbicacionPresenter } from '../presenters/ultima-ubicacion.presenter';

/** Conserva la ruta `real-time`, que es la que consulta el mapa del dashboard. */
@ApiTags('real-time-location')
@Controller('real-time')
export class UltimaUbicacionController {
  constructor(
    private readonly listarUltimas: ListarUltimasUbicacionesUseCase,
  ) {}

  /** Última posición de quienes reportaron en la última hora. */
  @Get('last-locations')
  async ultimas() {
    return UltimaUbicacionPresenter.lista(await this.listarUltimas.execute());
  }
}
