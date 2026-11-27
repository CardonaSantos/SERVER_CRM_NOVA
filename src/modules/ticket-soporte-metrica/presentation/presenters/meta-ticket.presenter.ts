import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  MetaTicketConAvance,
  TecnicoMetrica,
} from '../../domain/read-models/meta-ticket.read-model';
import {
  MetaTicketResponseDto,
  TecnicoMetricaResponseDto,
} from '../dto/meta-ticket-response.dto';

export class MetaTicketPresenter {
  static tecnico(t: TecnicoMetrica): TecnicoMetricaResponseDto {
    return { id: t.id, nombre: t.nombre, activo: t.activo };
  }

  static item(m: MetaTicketConAvance): MetaTicketResponseDto {
    return {
      id: m.id,
      titulo: m.titulo,
      tecnico: MetaTicketPresenter.tecnico(m.tecnico),
      fechaInicio: m.fechaInicio,
      fechaFin: m.fechaFin,
      objetivo: m.objetivo,
      avance: m.avance,
      faltantes: m.faltantes,
      porcentaje: m.porcentaje,
      estado: m.estado,
      diasTotales: m.diasTotales,
      diasTranscurridos: m.diasTranscurridos,
      proyeccion: m.proyeccion,
      creadaEn: m.creadoEn.toISOString(),
      actualizadaEn: m.actualizadoEn.toISOString(),
    };
  }

  static listado(
    resultado: ResultadoPaginado<MetaTicketConAvance>,
  ): RespuestaPaginada<MetaTicketResponseDto> {
    return presentarPaginado(resultado, (m) => MetaTicketPresenter.item(m));
  }
}
