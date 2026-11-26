import { TecnicoTrackingSesionEntity } from '../../domain/entities/tecnico-tracking-sesion.entity';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking-repository.port';
import { TecnicoTrackingSesionProps } from '../../domain/props/tecnico-tracking-sesion.props';

export const INICIO = new Date('2026-11-25T14:00:00.000Z');

/** La BD entrega una copia nueva en cada lectura: mutar la entidad no cambia lo guardado. */
const copia = (s: TecnicoTrackingSesionEntity) =>
  TecnicoTrackingSesionEntity.hydrate(s.toPrimitives());

export class TecnicoTrackingRepositoryFake
  implements TecnicoTrackingRepositoryPort
{
  readonly sesiones = new Map<number, TecnicoTrackingSesionEntity>();
  siguienteId = 1;

  /** Una sesión ACTIVA (o la que se indique) ya guardada, con asistencia 50. */
  sembrar(
    cambios: Partial<TecnicoTrackingSesionProps> = {},
  ): TecnicoTrackingSesionEntity {
    const entidad = TecnicoTrackingSesionEntity.hydrate({
      id: this.siguienteId++,
      tecnicoId: 7,
      asistenciaId: 50,
      iniciadoEn: INICIO,
      finalizadoEn: null,
      ultimoHeartbeatEn: INICIO,
      estado: EstadoTrackingTecnico.ACTIVA,
      ...cambios,
    });

    this.sesiones.set(entidad.id as number, entidad);

    return entidad;
  }

  findSessionForTechnician(params: {
    tecnicoId: number;
    sesionTrackingId: number;
  }): Promise<TecnicoTrackingSesionEntity | null> {
    const sesion = this.sesiones.get(params.sesionTrackingId);

    return Promise.resolve(
      sesion && sesion.tecnicoId === params.tecnicoId ? copia(sesion) : null,
    );
  }

  findActiveSessionByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingSesionEntity | null> {
    const activa = [...this.sesiones.values()].find(
      (s) => s.tecnicoId === tecnicoId && s.isActiva,
    );

    return Promise.resolve(activa ? copia(activa) : null);
  }

  findActiveSessionsWithHeartbeatBefore(params: {
    before: Date;
    limit: number;
  }): Promise<TecnicoTrackingSesionEntity[]> {
    return Promise.resolve(
      [...this.sesiones.values()]
        .filter(
          (s) =>
            s.isActiva &&
            s.ultimoHeartbeatEn.getTime() < params.before.getTime(),
        )
        .slice(0, params.limit)
        .map(copia),
    );
  }
}
