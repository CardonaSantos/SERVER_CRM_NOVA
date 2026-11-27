import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { CampaniaEntity } from '../../domain/entities/campania.entity';
import { EstadoEnvio } from '../../domain/enums/campania.enum';
import {
  CampaniaClienteNoEncontradoError,
  CampaniaSinDestinatariosError,
  MensajeriaPlantillaNoEncontradaError,
} from '../../domain/errors/mensajeria-cliente.errors';
import { resolverDestinos } from '../../domain/policies/destinatarios.policy';
import { asegurarEnviableEnCampania } from '../../domain/policies/plantilla.policy';
import {
  CAMPANIA_REPOSITORY,
  CampaniaRepositoryPort,
} from '../../domain/ports/campania-repository.port';
import {
  DESTINATARIO_QUERY,
  DestinatarioQueryPort,
} from '../../domain/ports/destinatario-query.port';
import { CampaniaReadModel } from '../../domain/read-models/campania.read-model';
import {
  PROVEEDOR_PLANTILLAS,
  ProveedorPlantillasPort,
} from '../ports/proveedor-plantillas.port';
import { DespachadorCampaniasService } from '../services/despachador-campanias.service';
import { ObtenerCampaniaUseCase } from './obtener-campania.use-case';

export type CrearCampaniaInput = {
  usuarioId: number;
  plantilla: string;
  idioma: string;
  clienteIds: number[];
  imagenUrl?: string;
};

/** Registra la campaña y deja el envío corriendo en segundo plano. */
@Injectable()
export class CrearCampaniaUseCase {
  private readonly logger = new Logger(CrearCampaniaUseCase.name);

  constructor(
    @Inject(PROVEEDOR_PLANTILLAS)
    private readonly plantillas: ProveedorPlantillasPort,
    @Inject(DESTINATARIO_QUERY)
    private readonly destinatarios: DestinatarioQueryPort,
    @Inject(CAMPANIA_REPOSITORY)
    private readonly campanias: CampaniaRepositoryPort,
    private readonly despachador: DespachadorCampaniasService,
    private readonly obtener: ObtenerCampaniaUseCase,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearCampaniaInput): Promise<CampaniaReadModel> {
    const imagenUrl = input.imagenUrl?.trim() || null;
    asegurarEnviableEnCampania(await this.buscarPlantilla(input), imagenUrl);

    const ids = [...new Set(input.clienteIds)];
    const clientes = await this.destinatarios.findByIds(ids);
    if (clientes.length !== ids.length) {
      throw new CampaniaClienteNoEncontradoError();
    }

    const destinos = resolverDestinos(
      [...clientes].sort((a, b) => a.id - b.id),
    );
    if (!destinos.some((d) => d.estado === EstadoEnvio.PENDIENTE)) {
      throw new CampaniaSinDestinatariosError();
    }

    const ahora = this.reloj.ahora();
    const campaniaId = await this.campanias.crear(
      CampaniaEntity.create(
        {
          plantilla: input.plantilla,
          idioma: input.idioma,
          imagenUrl,
          creadoPorId: input.usuarioId,
        },
        ahora,
      ),
      destinos,
      ahora,
    );
    this.logger.log(
      `Campaña ${campaniaId} creada por el usuario ${input.usuarioId} con ${destinos.length} destinos`,
    );
    this.despachador.despachar(campaniaId);

    return this.obtener.execute({ campaniaId });
  }

  private async buscarPlantilla(input: CrearCampaniaInput) {
    // El filtro por nombre de WhatsApp también trae coincidencias parciales.
    const { items } = await this.plantillas.listar({
      name: input.plantilla,
      limit: 100,
    });
    const plantilla = items.find(
      (p) => p.name === input.plantilla && p.language === input.idioma,
    );
    if (!plantilla) throw new MensajeriaPlantillaNoEncontradaError();
    return plantilla;
  }
}
