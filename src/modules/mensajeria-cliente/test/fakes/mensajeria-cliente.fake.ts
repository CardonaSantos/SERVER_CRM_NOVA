import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  MensajePlantilla,
  ProveedorMensajesPort,
} from '../../application/ports/proveedor-mensajes.port';
import {
  ArchivoImagen,
  NuevaPlantilla,
  PlantillaCreada,
  ProveedorPlantillasPort,
} from '../../application/ports/proveedor-plantillas.port';
import { CampaniaEntity } from '../../domain/entities/campania.entity';
import {
  EstadoCampania,
  EstadoEnvio,
  MotivoEnvio,
} from '../../domain/enums/campania.enum';
import {
  CampaniaEnCursoError,
  CampaniaNoReanudableError,
} from '../../domain/errors/mensajeria-cliente.errors';
import { limiteDeActividad } from '../../domain/policies/campania.policy';
import {
  ClienteDestinatario,
  DestinoCampania,
} from '../../domain/policies/destinatarios.policy';
import { CampaniaQueryPort } from '../../domain/ports/campania-query.port';
import {
  CampaniaRepositoryPort,
  EnvioReclamado,
  ResultadoEnvio,
} from '../../domain/ports/campania-repository.port';
import { DestinatarioQueryPort } from '../../domain/ports/destinatario-query.port';
import { CampaniaProps } from '../../domain/props/campania.props';
import {
  CampaniaReadModel,
  EnvioListItem,
} from '../../domain/read-models/campania.read-model';
import {
  PaginaPlantillas,
  PlantillaFiltros,
  PlantillaReadModel,
} from '../../domain/read-models/plantilla.read-model';

type EnvioGuardado = Omit<DestinoCampania, 'estado' | 'motivo'> &
  Omit<ResultadoEnvio, 'estado' | 'motivo'> & {
    id: number;
    campaniaId: number;
    estado: EstadoEnvio;
    motivo: MotivoEnvio | null;
  };

/** Repositorio y consulta de campañas en memoria. */
export class CampaniasFake
  implements CampaniaRepositoryPort, CampaniaQueryPort
{
  campanias: CampaniaProps[] = [];
  envios: EnvioGuardado[] = [];

  async crear(
    campania: CampaniaEntity,
    destinos: DestinoCampania[],
    ahora: Date,
  ): Promise<number> {
    this.exigirQueNingunaEsteEnviando(ahora);
    const id = this.campanias.length + 1;
    this.campanias.push({ ...campania.toPrimitives(), id });
    for (const destino of destinos) {
      this.envios.push({
        ...destino,
        id: this.envios.length + 1,
        campaniaId: id,
      });
    }
    return id;
  }

  async findById(id: number): Promise<CampaniaEntity | null> {
    const props = this.campanias.find((c) => c.id === id);
    return props ? CampaniaEntity.hydrate(props) : null;
  }

  async reanudar(campania: CampaniaEntity, ahora: Date): Promise<void> {
    this.exigirQueNingunaEsteEnviando(ahora);
    const guardada = this.campania(campania.id!);
    if (guardada.estado !== EstadoCampania.INTERRUMPIDA) {
      throw new CampaniaNoReanudableError();
    }
    Object.assign(guardada, campania.toPrimitives());
    for (const envio of this.de(campania.id!, EstadoEnvio.ENVIANDO)) {
      envio.estado = EstadoEnvio.SIN_CONFIRMAR;
    }
  }

  async tomarSiguiente(
    campaniaId: number,
    ahora: Date,
  ): Promise<EnvioReclamado | null> {
    const campania = this.campania(campaniaId);
    if (campania.estado !== EstadoCampania.EN_CURSO) return null;
    campania.actividadEn = ahora;

    const [envio] = this.de(campaniaId, EstadoEnvio.PENDIENTE);
    if (!envio) return null;
    envio.estado = EstadoEnvio.ENVIANDO;
    return { id: envio.id, telefono: envio.telefono! };
  }

  async registrarResultado(
    envioId: number,
    resultado: ResultadoEnvio,
  ): Promise<void> {
    const envio = this.envios.find((e) => e.id === envioId)!;
    if (envio.estado !== EstadoEnvio.ENVIANDO) return;
    Object.assign(envio, { motivo: null, ...resultado });
  }

  async interrumpir(campaniaId: number): Promise<void> {
    this.campania(campaniaId).estado = EstadoCampania.INTERRUMPIDA;
  }

  async completar(campaniaId: number, ahora: Date): Promise<void> {
    const campania = this.campania(campaniaId);
    const pendiente =
      this.de(campaniaId, EstadoEnvio.PENDIENTE).length +
      this.de(campaniaId, EstadoEnvio.ENVIANDO).length;
    if (campania.estado === EstadoCampania.EN_CURSO && pendiente === 0) {
      campania.estado = EstadoCampania.COMPLETADA;
      campania.finalizadaEn = ahora;
    }
  }

  async findMany(
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<CampaniaReadModel>> {
    const items = this.campanias.map((c) => this.leer(c)).reverse();
    return { items, total: items.length, ...paginacion };
  }

  async findDetail(id: number): Promise<CampaniaReadModel | null> {
    const campania = this.campanias.find((c) => c.id === id);
    return campania ? this.leer(campania) : null;
  }

  async findEnvios(): Promise<ResultadoPaginado<EnvioListItem>> {
    return { items: [], total: 0, page: 1, limit: 10 };
  }

  estados(campaniaId = 1): EstadoEnvio[] {
    return this.envios
      .filter((e) => e.campaniaId === campaniaId)
      .map((e) => e.estado);
  }

  private campania(id: number): CampaniaProps {
    return this.campanias.find((c) => c.id === id)!;
  }

  private de(campaniaId: number, estado: EstadoEnvio): EnvioGuardado[] {
    return this.envios.filter(
      (e) => e.campaniaId === campaniaId && e.estado === estado,
    );
  }

  private exigirQueNingunaEsteEnviando(ahora: Date): void {
    for (const c of this.campanias) {
      if (c.actividadEn < limiteDeActividad(ahora)) {
        if (c.estado === EstadoCampania.EN_CURSO) {
          c.estado = EstadoCampania.INTERRUMPIDA;
        }
      }
    }
    if (this.campanias.some((c) => c.estado === EstadoCampania.EN_CURSO)) {
      throw new CampaniaEnCursoError();
    }
  }

  private leer(c: CampaniaProps): CampaniaReadModel {
    const contar = (...estados: EstadoEnvio[]) =>
      estados.reduce((n, e) => n + this.de(c.id!, e).length, 0);
    return {
      ...c,
      id: c.id!,
      creadoPor: null,
      totales: {
        total: this.envios.filter((e) => e.campaniaId === c.id).length,
        pendientes: contar(EstadoEnvio.PENDIENTE, EstadoEnvio.ENVIANDO),
        enviados: contar(EstadoEnvio.ENVIADO),
        fallidos: contar(EstadoEnvio.FALLIDO),
        omitidos: contar(EstadoEnvio.OMITIDO),
        sinConfirmar: contar(EstadoEnvio.SIN_CONFIRMAR),
      },
    };
  }
}

export class DestinatariosFake implements DestinatarioQueryPort {
  clientes: ClienteDestinatario[] = [];

  async findByIds(ids: number[]): Promise<ClienteDestinatario[]> {
    return this.clientes.filter((c) => ids.includes(c.id));
  }
}

/** Nunca llama a Meta: guarda lo que se habría enviado. */
export class ProveedorMensajesFake implements ProveedorMensajesPort {
  enviados: MensajePlantilla[] = [];
  /** Error que lanza para un teléfono concreto. */
  fallos = new Map<string, Error>();

  async enviar(
    mensaje: MensajePlantilla,
  ): Promise<{ mensajeId: string | null }> {
    const fallo = this.fallos.get(mensaje.telefono);
    if (fallo) throw fallo;
    this.enviados.push(mensaje);
    return { mensajeId: `m-${this.enviados.length}` };
  }
}

export const plantillaAprobada = (
  cambios: Partial<PlantillaReadModel> = {},
): PlantillaReadModel => ({
  id: '1',
  name: 'aviso',
  status: 'APPROVED',
  category: 'UTILITY',
  language: 'es',
  components: [{ type: 'BODY', text: 'Hola' }],
  ...cambios,
});

export class ProveedorPlantillasFake implements ProveedorPlantillasPort {
  plantillas: PlantillaReadModel[] = [plantillaAprobada()];
  creadas: NuevaPlantilla[] = [];
  subidas: ArchivoImagen[] = [];

  async listar(filtros: PlantillaFiltros): Promise<PaginaPlantillas> {
    return {
      items: this.plantillas.filter((p) => p.name.includes(filtros.name ?? '')),
      siguiente: null,
    };
  }

  async crear(plantilla: NuevaPlantilla): Promise<PlantillaCreada> {
    this.creadas.push(plantilla);
    return { id: '9', status: 'PENDING', category: plantilla.category };
  }

  async eliminar(nombre: string): Promise<void> {
    this.plantillas = this.plantillas.filter((p) => p.name !== nombre);
  }

  async subirImagen(archivo: ArchivoImagen): Promise<{ handle: string }> {
    this.subidas.push(archivo);
    return { handle: 'h-1' };
  }
}
