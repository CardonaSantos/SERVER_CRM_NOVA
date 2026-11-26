import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ULTIMA_UBICACION_QUERY,
  UltimaUbicacionQueryPort,
} from '../../domain/ports/ultima-ubicacion-query.port';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';

/** Una posición más antigua que esto ya no se muestra en el mapa. */
const VIGENCIA_MS = 60 * 60 * 1000;

/**
 * Quién reportó su posición en la última hora, tenga o no la sesión de tracking
 * todavía activa (a diferencia del snapshot de sesiones activas).
 */
@Injectable()
export class ListarUltimasUbicacionesUseCase {
  constructor(
    @Inject(ULTIMA_UBICACION_QUERY)
    private readonly consulta: UltimaUbicacionQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(): Promise<UltimaUbicacionReadModel[]> {
    const desde = new Date(this.reloj.ahora().getTime() - VIGENCIA_MS);

    return this.consulta.findActualizadasDesde(desde);
  }
}
