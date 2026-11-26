import { RespuestaPaginada } from 'src/common/hexagonal/paginacion';

export class NombradoResponseDto {
  id: number;
  nombre: string;
}

export class ClasificacionCreditoResponseDto {
  puntualidadPct: number;
  promedioAtraso: number;
  medianaAtraso: number;
  rachaActual: number;
  score: number;
  clasificacion: string;
}

export class ClienteTablaResponseDto {
  id: number;
  nombreCompleto: string;
  estadoCliente: string;
  estadoCobranza: string;
  telefono: string | null;
  dpi: string | null;
  direccion: string | null;
  creadoEn: string;
  actualizadoEn: string;
  departamento: NombradoResponseDto | null;
  municipio: NombradoResponseDto | null;
  sector: NombradoResponseDto | null;
  facturacionZona: NombradoResponseDto | null;
  direccionIp: string | null;
  servicioInternet: {
    id: number;
    nombre: string;
    velocidad: string | null;
    precio: number;
    estado: string;
  } | null;
  clasificacionCredito: ClasificacionCreditoResponseDto;
}

export class ResumenCarteraResponseDto {
  activos: number;
  pagoPendiente: number;
  atrasados: number;
  morosos: number;
}

export type TablaClientesResponse =
  RespuestaPaginada<ClienteTablaResponseDto> & {
    resumen: ResumenCarteraResponseDto;
  };

export class ClienteRutaResponseDto {
  id: number;
  nombre: string;
  apellidos: string | null;
  telefono: string | null;
  direccion: string | null;
  estadoCliente: string;
  estadoCobranza: string;
  saldoPendiente: number;
  facturacionZona: NombradoResponseDto | null;
  sector: NombradoResponseDto | null;
  municipio: NombradoResponseDto | null;
  facturasPendientes: number;
  facturas: {
    id: number;
    montoFactura: number;
    fechaPagoEsperada: string | null;
  }[];
}

export class ClienteCampaniaResponseDto {
  id: number;
  nombre: string;
  facturasPendientes: number;
  estadoCliente: string;
  estadoCobranza: string;
  telefono: string | null;
  telefonoReferencia: string | null;
}
