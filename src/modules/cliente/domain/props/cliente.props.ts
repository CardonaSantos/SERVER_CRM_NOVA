import { EstadoCobranzaCliente } from '../enums/estado-cobranza-cliente.enum';
import {
  EstadoClientePersistido,
  EstadoOperativoCliente,
} from '../enums/estado-operativo-cliente.enum';
import { EstadoServicioMikrotik } from '../enums/estado-servicio-mikrotik.enum';
import { TipoCambioCliente } from '../enums/tipo-cambio-cliente.enum';

export type ClienteProps = {
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
  estadoCobranza: EstadoCobranzaCliente;
  municipioId: number | null;
  departamentoId: number | null;
  facturacionZonaId: number | null;
  mikrotikRouterId: number | null;
  estadoServicioMikrotik: EstadoServicioMikrotik;
  searchNombre: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  desinstaladoEn: Date | null;
  eliminadoPorId: number | null;
  motivoEliminacion: string | null;
  comentarioEliminacion: string | null;
};

/** Un alta elige su estado operativo; no se deduce de la cobranza. */
export type EstadoInicialCliente =
  | EstadoOperativoCliente.ACTIVO
  | EstadoOperativoCliente.PENDIENTE_ACTIVO
  | EstadoOperativoCliente.EN_INSTALACION;

export type ActualizarPerfilCliente = Partial<
  Pick<
    ClienteProps,
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
    ClienteProps,
    | 'empresaId'
    | 'asesorId'
    | 'servicioInternetId'
    | 'sectorId'
    | 'municipioId'
    | 'departamentoId'
    | 'facturacionZonaId'
    | 'mikrotikRouterId'
  >
>;

export type CrearClienteProps = ActualizarPerfilCliente &
  ActualizarAsignacionesCliente & {
    nombre: string;
    estadoInicial: EstadoInicialCliente;
  };

/** Renglón del historial del cliente. */
export type CambioCliente = {
  empresaId: number;
  clienteId: number;
  tipoCambio: TipoCambioCliente;
  estadoAnterior: EstadoClientePersistido | null;
  estadoNuevo: EstadoClientePersistido | null;
  /** Solo en altas y bajas lógicas. */
  eliminado?: { anterior: boolean; nuevo: boolean };
  motivo: string | null;
  descripcion: string | null;
  cambiadoPorId: number | null;
};
