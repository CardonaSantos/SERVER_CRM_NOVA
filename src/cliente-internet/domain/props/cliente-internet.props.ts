import {
  EstadoClientePersistido,
  EstadoCobranzaClienteDomain,
  EstadoOperativoCliente,
  // EstadoServicioMikrotikDomain,
} from '../enums/cliente-internet.enum';

export interface ClienteInternetProps {
  id: number | null;
  empresaId: number | null;
  asesorId: number | null;
  nombre: string;
  apellidos: string | null;
  dpi: string | null;
  observaciones: string | null;
  nota: string | null;
  telefono: string | null;
  direccion: string | null;
  contactoReferenciaNombre: string | null;
  contactoReferenciaTelefono: string | null;
  contrasenaWifi: string | null;
  ssidRouter: string | null;
  fechaInstalacion: Date | null;
  servicioInternetId: number | null;
  sectorId: number | null;
  enviarRecordatorio: boolean;
  isEliminado: boolean;
  eliminadoEn: Date | null;
  estadoCliente: EstadoClientePersistido;
  estadoCobranza: EstadoCobranzaClienteDomain;
  municipioId: number | null;
  departamentoId: number | null;
  facturacionZonaId: number | null;
  mikrotikRouterId: number | null;
  // estadoServicioMikrotik: EstadoServicioMikrotikDomain;
  searchNombre: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  desinstaladoEn: Date | null;
  eliminadoPorId: number | null;
  motivoEliminacion: string | null;
  comentarioEliminacion: string | null;
  restauradoEn: Date | null;
  restauradoPorId: number | null;
  whatsappActivo: boolean;
  whatsappDesactivadoEn: Date | null;
  whatsappDesactivadoPorId: number | null;
  motivoWhatsappDesactivado: string | null;
}

/** Nueva alta: obliga a elegir el estado operativo, no lo infiere del estado financiero. */
export type CrearClienteInternetProps = {
  nombre: string;
  estadoInicial:
    | EstadoOperativoCliente.ACTIVO
    | EstadoOperativoCliente.PENDIENTE_ACTIVO
    | EstadoOperativoCliente.EN_INSTALACION;
  empresaId?: number | null;
  asesorId?: number | null;
  apellidos?: string | null;
  dpi?: string | null;
  observaciones?: string | null;
  nota?: string | null;
  telefono?: string | null;
  direccion?: string | null;
  contactoReferenciaNombre?: string | null;
  contactoReferenciaTelefono?: string | null;
  contrasenaWifi?: string | null;
  ssidRouter?: string | null;
  fechaInstalacion?: Date | null;
  servicioInternetId?: number | null;
  sectorId?: number | null;
  municipioId?: number | null;
  departamentoId?: number | null;
  facturacionZonaId?: number | null;
  enviarRecordatorio?: boolean;
  whatsappActivo?: boolean;
};

export type ActualizarPerfilCliente = Partial<
  Pick<
    ClienteInternetProps,
    | 'nombre'
    | 'apellidos'
    | 'dpi'
    | 'observaciones'
    | 'nota'
    | 'telefono'
    | 'direccion'
    | 'contactoReferenciaNombre'
    | 'contactoReferenciaTelefono'
    | 'contrasenaWifi'
    | 'ssidRouter'
    | 'fechaInstalacion'
    | 'enviarRecordatorio'
  >
>;

export type ActualizarAsignacionesCliente = Partial<
  Pick<
    ClienteInternetProps,
    | 'asesorId'
    | 'servicioInternetId'
    | 'sectorId'
    | 'municipioId'
    | 'departamentoId'
    | 'facturacionZonaId'
  >
>;

/** Solo puede emitirse por el caso de uso que haya confirmado la operación PPPoE. */
export interface ConfirmacionOperacionPppoe {
  operacionPppoeId: number;
  cuentaPppoeId: number;
  confirmadoEn: Date;
}
