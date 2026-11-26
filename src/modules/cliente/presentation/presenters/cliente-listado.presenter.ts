import {
  presentarPaginado,
  RespuestaPaginada,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  ClienteClasificado,
  ListarClientesResult,
} from '../../application/use-cases/listar-clientes.use-case';
import {
  ClienteCampaniaItem,
  ClienteOpcion,
  ClienteRutaItem,
  NombradoReadModel,
} from '../../domain/read-models/cliente-listado.read-model';
import {
  ClienteCampaniaResponseDto,
  ClienteRutaResponseDto,
  ClienteTablaResponseDto,
  NombradoResponseDto,
  TablaClientesResponse,
} from '../dto/cliente-listado-response.dto';

const fecha = (valor: Date | null): string | null =>
  valor ? valor.toISOString() : null;

export const nombreCompleto = (c: {
  nombre: string;
  apellidos: string | null;
}): string => `${c.nombre} ${c.apellidos ?? ''}`.trim();

export const nombrado = (
  valor: NombradoReadModel | null,
): NombradoResponseDto | null =>
  valor ? { id: valor.id, nombre: valor.nombre } : null;

export class ClienteListadoPresenter {
  static fila(c: ClienteClasificado): ClienteTablaResponseDto {
    const plan = c.servicioInternet;
    const credito = c.clasificacionCredito;

    return {
      id: c.id,
      nombreCompleto: nombreCompleto(c),
      estadoCliente: c.estadoCliente,
      estadoCobranza: c.estadoCobranza,
      telefono: c.telefono,
      dpi: c.dpi,
      direccion: c.direccion,
      creadoEn: c.creadoEn.toISOString(),
      actualizadoEn: c.actualizadoEn.toISOString(),
      departamento: nombrado(c.departamento),
      municipio: nombrado(c.municipio),
      sector: nombrado(c.sector),
      facturacionZona: nombrado(c.facturacionZona),
      direccionIp: c.direccionIp,
      servicioInternet: plan && {
        id: plan.id,
        nombre: plan.nombre,
        velocidad: plan.velocidad,
        precio: plan.precio,
        estado: plan.estado,
      },
      clasificacionCredito: {
        puntualidadPct: credito.puntualidadPct,
        promedioAtraso: credito.promedioAtraso,
        medianaAtraso: credito.medianaAtraso,
        rachaActual: credito.rachaActual,
        score: credito.score,
        clasificacion: credito.clasificacion,
      },
    };
  }

  static tabla(r: ListarClientesResult): TablaClientesResponse {
    return {
      ...presentarPaginado(r, ClienteListadoPresenter.fila),
      resumen: {
        activos: r.resumen.activos,
        pagoPendiente: r.resumen.pagoPendiente,
        atrasados: r.resumen.atrasados,
        morosos: r.resumen.morosos,
      },
    };
  }

  static paraRuta(c: ClienteRutaItem): ClienteRutaResponseDto {
    return {
      id: c.id,
      nombre: c.nombre,
      apellidos: c.apellidos,
      telefono: c.telefono,
      direccion: c.direccion,
      estadoCliente: c.estadoCliente,
      estadoCobranza: c.estadoCobranza,
      saldoPendiente: c.saldoPendiente,
      facturacionZona: nombrado(c.facturacionZona),
      sector: nombrado(c.sector),
      municipio: nombrado(c.municipio),
      facturasPendientes: c.facturas.length,
      facturas: c.facturas.map((f) => ({
        id: f.id,
        montoFactura: f.montoFactura,
        fechaPagoEsperada: fecha(f.fechaPagoEsperada),
      })),
    };
  }

  static listadoRuta(
    r: ResultadoPaginado<ClienteRutaItem>,
  ): RespuestaPaginada<ClienteRutaResponseDto> {
    return presentarPaginado(r, ClienteListadoPresenter.paraRuta);
  }

  static campania(items: ClienteCampaniaItem[]): ClienteCampaniaResponseDto[] {
    return items.map((c) => ({
      id: c.id,
      nombre: nombreCompleto(c),
      facturasPendientes: c.facturasPendientes,
      estadoCliente: c.estadoCliente,
      estadoCobranza: c.estadoCobranza,
      telefono: c.telefono,
      telefonoReferencia: c.telefonoReferencia,
    }));
  }

  static opciones(items: ClienteOpcion[]): NombradoResponseDto[] {
    return items.map((c) => ({ id: c.id, nombre: nombreCompleto(c) }));
  }
}
