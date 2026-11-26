import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';
import { UltimaUbicacionResponseDto } from '../dto/ultima-ubicacion-response.dto';

export class UltimaUbicacionPresenter {
  static item(u: UltimaUbicacionReadModel): UltimaUbicacionResponseDto {
    return {
      usuarioId: u.usuarioId,
      latitud: u.latitud,
      longitud: u.longitud,
      precision: u.precision,
      velocidad: u.velocidad,
      bateria: u.bateria,
      actualizadoEn: u.actualizadoEn.toISOString(),
      usuario: {
        nombre: u.usuario.nombre,
        rol: u.usuario.rol,
        telefono: u.usuario.telefono,
        avatarUrl: u.usuario.avatarUrl,
      },
      ticketsEnProceso: u.ticketsEnProceso.map((t) => ({
        id: t.id,
        titulo: t.titulo,
      })),
    };
  }

  static lista(
    ubicaciones: UltimaUbicacionReadModel[],
  ): UltimaUbicacionResponseDto[] {
    return ubicaciones.map((u) => UltimaUbicacionPresenter.item(u));
  }
}
