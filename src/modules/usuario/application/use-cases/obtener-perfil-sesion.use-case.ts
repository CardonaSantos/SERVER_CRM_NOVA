import { Inject, Injectable } from '@nestjs/common';
import {
  USUARIO_QUERY,
  UsuarioQueryPort,
} from '../../domain/ports/usuario-query.port';
import { PerfilSesion } from '../../domain/read-models/usuario-listado.read-model';

/** Datos de quien tiene sesión; `null` si no existe o está eliminado. */
@Injectable()
export class ObtenerPerfilSesionUseCase {
  constructor(
    @Inject(USUARIO_QUERY) private readonly consultas: UsuarioQueryPort,
  ) {}

  execute(usuarioId: number): Promise<PerfilSesion | null> {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      return Promise.resolve(null);
    }

    return this.consultas.findPerfilSesion(usuarioId);
  }
}
