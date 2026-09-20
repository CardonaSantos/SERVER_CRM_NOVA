import { MikrotikRouterEntity } from 'src/mikro-tik/domain/entities/mikrotik-router-entity';

export type MikrotikRouterPublicoReadModel = {
  id: number;

  empresaId: number;

  nombre: string;

  host: string;

  sshPort: number;

  usuario: string;

  descripcion: string | null;

  activo: boolean;

  oltId: number | null;

  tieneCredencialSsh: boolean;

  creadoEn: Date;

  actualizadoEn: Date;
};

export function toMikrotikRouterPublico(
  entity: MikrotikRouterEntity,
): MikrotikRouterPublicoReadModel {
  if (entity.id === null) {
    throw new Error(
      'No puede generarse una respuesta pública para un router sin id.',
    );
  }

  return {
    id: entity.id,

    empresaId: entity.empresaId,

    nombre: entity.nombre,

    host: entity.host,

    sshPort: entity.sshPort,

    usuario: entity.usuario,

    descripcion: entity.descripcion,

    activo: entity.activo,

    oltId: entity.oltId,

    tieneCredencialSsh: entity.tieneCredencialSsh,

    creadoEn: entity.creadoEn,

    actualizadoEn: entity.actualizadoEn,
  };
}
