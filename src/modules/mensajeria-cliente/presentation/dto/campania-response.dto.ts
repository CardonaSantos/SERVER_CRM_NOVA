import { EstadoCampania, EstadoEnvio } from '../../domain/enums/campania.enum';

export class TotalesCampaniaResponseDto {
  /** Destinos */ total: number;
  /** Sin enviar todavía */ pendientes: number;
  /** Aceptados por WhatsApp */ enviados: number;
  /** Rechazados */ fallidos: number;
  /** No se intentaron (ver motivo) */ omitidos: number;
  /** No se sabe si salieron */ sinConfirmar: number;
}

export class CampaniaResponseDto {
  /** Id de la campaña */ id: number;
  /** Plantilla enviada */ plantilla: string;
  /** Idioma */ idioma: string;
  /** Imagen del encabezado */ imagenUrl: string | null;
  /** EN_CURSO, COMPLETADA o INTERRUMPIDA */ estado: EstadoCampania;
  /** Inicio */ creadaEn: string;
  /** Fin, si se completó */ finalizadaEn: string | null;
  /** Quién la lanzó */ creadaPor: { id: number; nombre: string } | null;
  /** Avance */ totales: TotalesCampaniaResponseDto;
}

export class EnvioCampaniaResponseDto {
  /** Id del destino */ id: number;
  /** Cliente */ clienteId: number;
  /** Nombre del cliente */ cliente: string;
  /** Número usado */ telefono: string | null;
  /** Resultado */ estado: EstadoEnvio;
  /** Código de por qué no se envió */ motivo: string | null;
  /** Explicación de WhatsApp */ detalle: string | null;
  /** Cuándo se intentó */ intentadoEn: string | null;
}
