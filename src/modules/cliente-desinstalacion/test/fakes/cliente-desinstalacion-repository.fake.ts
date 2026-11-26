import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entity';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import { ClienteDesinstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion-repository.port';

export const SOLICITUD = new Date('2026-11-20T10:00:00.000Z');
export const INICIO = new Date('2026-11-25T14:00:00.000Z');
export const FIN = new Date('2026-11-25T16:00:00.000Z');

/** Desinstalaciones en memoria; `sembrar` deja una ya guardada con fechas coherentes. */
export class ClienteDesinstalacionRepositoryFake
  implements ClienteDesinstalacionRepositoryPort
{
  readonly filas = new Map<number, ClienteDesinstalacionEntity>();
  guardados = 0;
  private siguienteId = 100;

  sembrar(
    estado: EstadoDesinstalacionCliente = EstadoDesinstalacionCliente.PROGRAMADA,
    extra: Record<string, unknown> = {},
  ): ClienteDesinstalacionEntity {
    const id = this.siguienteId++;
    const base = ClienteDesinstalacionEntity.create({
      empresaId: 1,
      clienteId: 7,
      accesoInternetId: 500,
      servicioInternetId: 3,
      fechaSolicitud: SOLICITUD,
    }).toPrimitives();
    const enMarcha = estado !== EstadoDesinstalacionCliente.PROGRAMADA;
    const cerrada =
      estado === EstadoDesinstalacionCliente.COMPLETADA ||
      estado === EstadoDesinstalacionCliente.FALLIDA;
    const cancelada = estado === EstadoDesinstalacionCliente.CANCELADA;

    const entidad = ClienteDesinstalacionEntity.hydrate({
      ...base,
      id,
      estado,
      fechaInicio: enMarcha && !cancelada ? INICIO : null,
      fechaFinalizacion: cerrada ? FIN : null,
      fechaCancelacion: cancelada ? FIN : null,
      ...extra,
    });

    this.filas.set(id, entidad);

    return entidad;
  }

  create(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    const creada = ClienteDesinstalacionEntity.hydrate({
      ...entity.toPrimitives(),
      id: this.siguienteId++,
    });

    this.filas.set(creada.id as number, creada);

    return Promise.resolve(creada);
  }

  findById(id: number): Promise<ClienteDesinstalacionEntity | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }

  save(
    entity: ClienteDesinstalacionEntity,
  ): Promise<ClienteDesinstalacionEntity> {
    this.guardados++;
    this.filas.set(entity.id as number, entity);

    return Promise.resolve(entity);
  }
}
