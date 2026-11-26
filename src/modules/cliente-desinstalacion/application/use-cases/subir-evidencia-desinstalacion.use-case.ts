import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ALMACENAMIENTO_MEDIA,
  AlmacenamientoMediaFacadePort,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  CategoriaMedia,
  TipoMedia,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.types';
import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { ClienteDesinstalacionMediaEntity } from '../../domain/entities/cliente-desinstalacion-media.entity';
import {
  ClienteDesinstalacionNoEncontradaError,
  EvidenciaDesinstalacionRequeridaError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_MEDIA_REPOSITORY,
  ClienteDesinstalacionMediaRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-media-repository.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  EvidenciaDesinstalacionResumen,
  resumirEvidencia,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

export type ArchivoEvidenciaDesinstalacion = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export type SubirEvidenciaDesinstalacionInput = {
  desinstalacionId: number;
  subidoPorId: number;
  file: ArchivoEvidenciaDesinstalacion | undefined;
  tipo?: TipoEvidenciaClienteOperacion | null;
  descripcion?: string | null;
  orden?: number | null;
};

export type SubirEvidenciaDesinstalacionResult = {
  evidencia: EvidenciaDesinstalacionResumen;
  media: { id: number; cdnUrl: string | null; key: string; tipo: TipoMedia };
};

@Injectable()
export class SubirEvidenciaDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_MEDIA_REPOSITORY)
    private readonly evidencias: ClienteDesinstalacionMediaRepositoryPort,

    @Inject(ALMACENAMIENTO_MEDIA)
    private readonly almacenamiento: AlmacenamientoMediaFacadePort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: SubirEvidenciaDesinstalacionInput,
  ): Promise<SubirEvidenciaDesinstalacionResult> {
    if (!input.file?.buffer?.length || !input.file.mimetype?.trim()) {
      throw new EvidenciaDesinstalacionRequeridaError();
    }

    const desinstalacion = await this.desinstalaciones.findById(
      input.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    const media = await this.almacenamiento.subirMedia({
      empresaId: desinstalacion.empresaId,
      clienteId: desinstalacion.clienteId,
      subidoPorId: input.subidoPorId,
      buffer: input.file.buffer,
      mime: input.file.mimetype,
      fileName: input.file.originalname,
      categoria: CategoriaMedia.CLIENTE_DESINSTALACION,
      tipo: this.tipoMedia(input.file.mimetype),
      publico: true,
      descripcion: input.descripcion ?? undefined,
      etiqueta: 'DESINSTALACION',
      basePrefix: 'crm/desinstalaciones',
    });

    const guardada = await this.evidencias.create(
      ClienteDesinstalacionMediaEntity.create(
        {
          desinstalacionId: input.desinstalacionId,
          mediaId: media.id,
          tipo: input.tipo ?? TipoEvidenciaClienteOperacion.OTRO,
          descripcion: input.descripcion ?? null,
          orden: input.orden ?? 0,
        },
        this.reloj.ahora(),
      ),
    );

    return {
      evidencia: resumirEvidencia(guardada),
      media: {
        id: media.id,
        cdnUrl: media.cdnUrl ?? null,
        key: media.key,
        tipo: media.tipo,
      },
    };
  }

  private tipoMedia(mime: string): TipoMedia {
    const normalizado = mime.trim().toLowerCase();

    if (normalizado.startsWith('image/')) return TipoMedia.IMAGEN;
    if (normalizado.startsWith('video/')) return TipoMedia.VIDEO;
    if (normalizado.startsWith('audio/')) return TipoMedia.AUDIO;
    if (normalizado.startsWith('application/')) return TipoMedia.DOCUMENTO;

    return TipoMedia.OTRO;
  }
}
