import {
  EstadoAccesoInternet,
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from '../enums/cliente-acceso-internet.enum';

export type ClienteAccesoInternetProps = {
  id: number | null;
  empresaId: number;
  clienteId: number;
  servicioInternetId: number | null;
  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
  estado: EstadoAccesoInternet;
  activadoEn: Date | null;
  suspendidoEn: Date | null;
  dadoDeBajaEn: Date | null;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type CrearClienteAccesoInternetProps = {
  empresaId: number;
  clienteId: number;
  servicioInternetId?: number | null;
  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
};

/** Acceso que ya opera en el router y se incorpora al CRM (adopción). */
export type AdoptarClienteAccesoInternetProps = {
  empresaId: number;
  clienteId: number;
  servicioInternetId: number;
  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
  /** Estado observado en MikroTik. */
  estadoRemoto: EstadoAccesoInternet.ACTIVO | EstadoAccesoInternet.SUSPENDIDO;
  /** Cuándo entró al CRM; no es la fecha histórica de activación. */
  fechaAdopcion: Date;
};
