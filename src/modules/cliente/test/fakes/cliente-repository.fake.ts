import { ClienteEntity } from '../../domain/entities/cliente.entity';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';
import { EstadoServicioMikrotik } from '../../domain/enums/estado-servicio-mikrotik.enum';
import { ClienteModificadoError } from '../../domain/errors/cliente.errors';
import { Coordenadas } from '../../domain/policies/coordenadas.policy';
import {
  ClienteRepositoryPort,
  GuardarIpCliente,
} from '../../domain/ports/cliente-repository.port';
import { IpClienteReadModel } from '../../domain/read-models/ip-cliente.read-model';
import { CambioCliente, ClienteProps } from '../../domain/props/cliente.props';

export const CREADO = new Date('2026-01-10T12:00:00.000Z');

export function clienteProps(extra: Partial<ClienteProps> = {}): ClienteProps {
  return {
    id: 7,
    empresaId: 1,
    asesorId: null,
    nombre: 'María',
    apellidos: 'Pérez',
    dpi: null,
    observaciones: null,
    nota: null,
    telefono: null,
    direccion: null,
    contactoReferenciaNombre: null,
    contactoReferenciaTelefono: null,
    contrasenaWifi: null,
    ssidRouter: null,
    fechaInstalacion: null,
    servicioInternetId: 3,
    sectorId: null,
    enviarRecordatorio: true,
    isEliminado: false,
    eliminadoEn: null,
    estadoCliente: EstadoOperativoCliente.ACTIVO,
    estadoCobranza: EstadoCobranzaCliente.AL_DIA,
    municipioId: null,
    departamentoId: null,
    facturacionZonaId: 2,
    mikrotikRouterId: null,
    estadoServicioMikrotik: EstadoServicioMikrotik.SIN_MIKROTIK,
    searchNombre: 'maria perez',
    creadoEn: CREADO,
    actualizadoEn: CREADO,
    desinstaladoEn: null,
    eliminadoPorId: null,
    motivoEliminacion: null,
    comentarioEliminacion: null,
    ...extra,
  };
}

/** Clientes en memoria; cada lectura devuelve una copia. */
export class ClienteRepositoryFake implements ClienteRepositoryPort {
  readonly filas = new Map<number, ClienteProps>();
  readonly historial: CambioCliente[] = [];
  readonly ips = new Map<number, GuardarIpCliente>();
  readonly ubicaciones = new Map<number, Coordenadas>();
  readonly servicios = new Map<number, number[]>();

  sembrar(extra: Partial<ClienteProps> = {}): ClienteProps {
    const props = clienteProps(extra);
    this.filas.set(props.id!, props);
    return props;
  }

  findById(id: number): Promise<ClienteEntity | null> {
    const fila = this.filas.get(id);
    return Promise.resolve(fila ? ClienteEntity.hydrate(fila) : null);
  }

  update(entity: ClienteEntity): Promise<ClienteEntity> {
    const fila = this.filas.get(entity.id!)!;
    const cambios = entity.getChangedPrimitives();

    if (
      cambios.estadoCliente !== undefined &&
      fila.estadoCliente !== entity.estadoOriginal
    ) {
      return Promise.reject(new ClienteModificadoError());
    }

    const nueva = { ...fila, ...cambios };
    this.filas.set(entity.id!, nueva);
    return Promise.resolve(ClienteEntity.hydrate(nueva));
  }

  create(entity: ClienteEntity): Promise<ClienteEntity> {
    const id = 100 + this.filas.size;
    const props = { ...entity.toPrimitives(), id };
    this.filas.set(id, props);
    return Promise.resolve(ClienteEntity.hydrate(props));
  }

  guardarIp(
    clienteId: number,
    ip: GuardarIpCliente,
  ): Promise<IpClienteReadModel> {
    this.ips.set(clienteId, ip);
    return Promise.resolve({
      id: 1,
      clienteId,
      direccionIp: ip.direccionIp ?? null,
      gateway: ip.gateway ?? null,
      mascara: ip.mascara ?? null,
    });
  }

  guardarUbicacion(
    clienteId: number,
    _empresaId: number,
    coordenadas: Coordenadas,
  ): Promise<void> {
    this.ubicaciones.set(clienteId, coordenadas);
    return Promise.resolve();
  }

  reemplazarServicios(clienteId: number, servicioIds: number[]): Promise<void> {
    this.servicios.set(clienteId, servicioIds);
    return Promise.resolve();
  }

  registrarCambio(cambio: CambioCliente): Promise<void> {
    this.historial.push(cambio);
    return Promise.resolve();
  }
}
