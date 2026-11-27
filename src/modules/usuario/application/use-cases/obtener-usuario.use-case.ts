import { Inject, Injectable } from '@nestjs/common';
import { UsuarioNoEncontradoError } from '../../domain/errors/usuario.errors';
import {
  USUARIO_QUERY,
  UsuarioQueryPort,
} from '../../domain/ports/usuario-query.port';
import { UsuarioDetalle } from '../../domain/read-models/usuario-listado.read-model';

@Injectable()
export class ObtenerUsuarioUseCase {
  constructor(
    @Inject(USUARIO_QUERY) private readonly consultas: UsuarioQueryPort,
  ) {}

  async execute(usuarioId: number): Promise<UsuarioDetalle> {
    const usuario = await this.consultas.findDetail(usuarioId);
    if (!usuario) throw new UsuarioNoEncontradoError();

    return usuario;
  }
}
