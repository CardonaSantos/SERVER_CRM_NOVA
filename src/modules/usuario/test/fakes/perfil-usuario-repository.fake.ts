import { PerfilUsuarioEntity } from '../../domain/entities/perfil-usuario.entity';
import { PerfilUsuarioRepositoryPort } from '../../domain/ports/perfil-usuario-repository.port';
import { PerfilUsuarioProps } from '../../domain/props/perfil-usuario.props';

export class PerfilUsuarioRepositoryFake
  implements PerfilUsuarioRepositoryPort
{
  readonly filas = new Map<number, PerfilUsuarioProps>();
  /** Si se pone, `guardar` falla con este error. */
  fallarAlGuardar: Error | null = null;
  private siguienteId = 1;

  findByUsuarioId(usuarioId: number): Promise<PerfilUsuarioEntity | null> {
    const fila = this.filas.get(usuarioId);

    return Promise.resolve(
      fila ? PerfilUsuarioEntity.hydrate({ ...fila }) : null,
    );
  }

  async guardar(entity: PerfilUsuarioEntity): Promise<PerfilUsuarioEntity> {
    if (this.fallarAlGuardar) throw this.fallarAlGuardar;
    const props = entity.toPrimitives();
    const id = this.filas.get(props.usuarioId)?.id ?? this.siguienteId++;
    this.filas.set(props.usuarioId, { ...props, id });

    return (await this.findByUsuarioId(props.usuarioId))!;
  }
}
