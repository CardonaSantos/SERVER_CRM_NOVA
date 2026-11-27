import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { UsuarioCorreoDuplicadoError } from '../../domain/errors/usuario.errors';
import { UsuarioRepositoryPort } from '../../domain/ports/usuario-repository.port';
import { UsuarioProps } from '../../domain/props/usuario.props';

export class UsuarioRepositoryFake implements UsuarioRepositoryPort {
  readonly filas = new Map<number, UsuarioProps>();
  /** Bloqueos y escrituras, en orden. */
  readonly pasos: string[] = [];
  private siguienteId = 1;

  sembrar(cambios: Partial<UsuarioProps> = {}): number {
    const id = cambios.id ?? this.siguienteId++;
    this.siguienteId = Math.max(this.siguienteId, id + 1);
    this.filas.set(id, {
      empresaId: 1,
      nombre: `Usuario ${id}`,
      correo: `usuario${id}@correo.test`,
      telefono: null,
      rol: RolUsuario.OFICINA,
      activo: true,
      contrasenaHash: 'hash:secreta1',
      creadoEn: new Date('2026-01-01T00:00:00Z'),
      actualizadoEn: new Date('2026-01-01T00:00:00Z'),
      eliminadoEn: null,
      eliminadoPorId: null,
      correoEliminado: null,
      ...cambios,
      id,
    });
    return id;
  }

  fila(id: number): UsuarioProps {
    return this.filas.get(id)!;
  }

  findById(id: number): Promise<UsuarioEntity | null> {
    const fila = this.filas.get(id);

    return Promise.resolve(fila ? UsuarioEntity.hydrate({ ...fila }) : null);
  }

  findByCorreo(correo: string): Promise<UsuarioEntity | null> {
    const fila = [...this.filas.values()].find((f) => f.correo === correo);

    return Promise.resolve(fila ? UsuarioEntity.hydrate({ ...fila }) : null);
  }

  async create(entity: UsuarioEntity): Promise<UsuarioEntity> {
    this.asegurarCorreoLibre(entity.correo, null);
    const id = this.siguienteId++;
    this.filas.set(id, { ...entity.toPrimitives(), id });
    this.pasos.push(`crear:${id}`);

    return (await this.findById(id))!;
  }

  async update(entity: UsuarioEntity): Promise<UsuarioEntity> {
    this.asegurarCorreoLibre(entity.correo, entity.id);
    this.filas.set(entity.id!, entity.toPrimitives());
    this.pasos.push(`guardar:${entity.id}`);

    return (await this.findById(entity.id!))!;
  }

  bloquearParaModificar(id: number): Promise<void> {
    this.pasos.push(`bloquear:${id}`);
    return Promise.resolve();
  }

  bloquearSuperAdmins(): Promise<void> {
    this.pasos.push('superAdmins');
    return Promise.resolve();
  }

  contarSuperAdminsActivos(): Promise<number> {
    return Promise.resolve(
      [...this.filas.values()].filter(
        (f) => f.rol === RolUsuario.SUPER_ADMIN && f.activo && !f.eliminadoEn,
      ).length,
    );
  }

  /** Como la llave única de la base. */
  private asegurarCorreoLibre(correo: string, id: number | null): void {
    const otro = [...this.filas.values()].find(
      (f) => f.correo === correo && f.id !== id,
    );
    if (otro) throw new UsuarioCorreoDuplicadoError();
  }
}
