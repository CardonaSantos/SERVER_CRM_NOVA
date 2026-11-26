import { UltimaUbicacionQueryPort } from '../../domain/ports/ultima-ubicacion-query.port';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';

export class UltimaUbicacionQueryFake implements UltimaUbicacionQueryPort {
  ubicaciones: UltimaUbicacionReadModel[] = [];

  /** Si se asigna, `findByUsuario` falla con este error. */
  fallaPorUsuario: Error | null = null;

  desdeConsultado: Date | null = null;

  findActualizadasDesde(desde: Date): Promise<UltimaUbicacionReadModel[]> {
    this.desdeConsultado = desde;

    return Promise.resolve(
      this.ubicaciones.filter((u) => u.actualizadoEn >= desde),
    );
  }

  findByUsuario(usuarioId: number): Promise<UltimaUbicacionReadModel | null> {
    if (this.fallaPorUsuario) return Promise.reject(this.fallaPorUsuario);

    return Promise.resolve(
      this.ubicaciones.find((u) => u.usuarioId === usuarioId) ?? null,
    );
  }
}
