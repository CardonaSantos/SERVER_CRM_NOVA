import { UltimaUbicacionQueryPort } from '../../domain/ports/ultima-ubicacion-query.port';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';

export class UltimaUbicacionQueryFake implements UltimaUbicacionQueryPort {
  ubicaciones: UltimaUbicacionReadModel[] = [];

  desdeConsultado: Date | null = null;

  findActualizadasDesde(desde: Date): Promise<UltimaUbicacionReadModel[]> {
    this.desdeConsultado = desde;

    return Promise.resolve(
      this.ubicaciones.filter((u) => u.actualizadoEn >= desde),
    );
  }
}
