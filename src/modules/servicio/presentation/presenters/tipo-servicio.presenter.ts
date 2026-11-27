import { TipoServicioEntity } from '../../domain/entities/tipo-servicio.entity';
import { TipoServicioResponseDto } from '../dto/tipo-servicio-response.dto';

export class TipoServicioPresenter {
  static item(entity: TipoServicioEntity): TipoServicioResponseDto {
    const tipo = entity.toPrimitives();

    return {
      id: tipo.id!,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      estado: tipo.estado,
      creadoEn: tipo.creadoEn.toISOString(),
      actualizadoEn: tipo.actualizadoEn.toISOString(),
    };
  }
}
