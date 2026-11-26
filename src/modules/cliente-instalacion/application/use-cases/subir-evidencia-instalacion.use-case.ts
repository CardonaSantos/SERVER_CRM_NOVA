import { Inject, Injectable } from '@nestjs/common';
import {
  ALMACENAMIENTO_MEDIA,
  AlmacenamientoMediaFacadePort,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.facade.port';
import {
  CategoriaMedia,
  TipoMedia,
} from 'src/modules/almacenamiento-media/public/almacenamiento-media.types';
import { ClienteInstalacionMediaEntity } from '../../domain/entities/cliente-instalacion-media.entity';
import { TipoEvidenciaClienteOperacion } from '../../domain/enums/tipo-evidencia-cliente-operacion.enum';
import {
  ClienteInstalacionNoEncontradaError,
  EvidenciaInstalacionRequeridaError,
} from '../../domain/errors/cliente-instalacion.errors';
import {
  CLIENTE_INSTALACION_MEDIA_REPOSITORY,
  ClienteInstalacionMediaRepositoryPort,
} from '../../domain/ports/cliente-instalacion-media-repository.port';
import {
  CLIENTE_INSTALACION_REPOSITORY,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion-repository.port';

export type ArchivoEvidencia = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

export type SubirEvidenciaInstalacionInput = {
  instalacionId: number;
  /** La tabla de media exige empresa al insertar; sale del usuario autenticado. */
  empresaId: number;
  subidoPorId: number;
  file: ArchivoEvidencia | undefined;
  tipo: TipoEvidenciaClienteOperacion;
  descripcion?: string | null;
  orden?: number | null;
};

export type SubirEvidenciaInstalacionResult = {
  id: number | null;
  instalacionId: number;
  mediaId: number;
  tipo: TipoEvidenciaClienteOperacion;
  descripcion: string | null;
  orden: number;
  creadoEn: Date | null;
};

@Injectable()
export class SubirEvidenciaInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalaciones: ClienteInstalacionRepositoryPort,

    @Inject(CLIENTE_INSTALACION_MEDIA_REPOSITORY)
    private readonly evidencias: ClienteInstalacionMediaRepositoryPort,

    @Inject(ALMACENAMIENTO_MEDIA)
    private readonly almacenamiento: AlmacenamientoMediaFacadePort,
  ) {}

  async execute(
    input: SubirEvidenciaInstalacionInput,
  ): Promise<SubirEvidenciaInstalacionResult> {
    if (!input.file) {
      throw new EvidenciaInstalacionRequeridaError();
    }

    const instalacion = await this.instalaciones.findById(input.instalacionId);

    if (!instalacion) {
      throw new ClienteInstalacionNoEncontradaError();
    }

    const media = await this.almacenamiento.subirMedia({
      empresaId: input.empresaId,
      clienteId: instalacion.clienteId,
      subidoPorId: input.subidoPorId,
      buffer: input.file.buffer,
      mime: input.file.mimetype,
      fileName: input.file.originalname,
      categoria: CategoriaMedia.CLIENTE_GENERAL,
      tipo: this.tipoMedia(input.file.mimetype),
      publico: true,
      descripcion: input.descripcion ?? undefined,
      etiqueta: 'INSTALACION',
      basePrefix: 'crm/instalaciones',
    });

    const guardada = await this.evidencias.create(
      ClienteInstalacionMediaEntity.create({
        instalacionId: input.instalacionId,
        mediaId: media.id,
        tipo: input.tipo,
        descripcion: input.descripcion ?? null,
        orden: input.orden ?? 0,
      }),
    );

    const p = guardada.toPrimitives();

    return {
      id: p.id ?? null,
      instalacionId: p.instalacionId,
      mediaId: p.mediaId,
      tipo: p.tipo,
      descripcion: p.descripcion ?? null,
      orden: p.orden,
      creadoEn: p.creadoEn ?? null,
    };
  }

  private tipoMedia(mime: string): TipoMedia {
    if (mime.startsWith('image/')) return TipoMedia.IMAGEN;
    if (mime.startsWith('video/')) return TipoMedia.VIDEO;
    if (mime.startsWith('audio/')) return TipoMedia.AUDIO;
    if (mime === 'application/pdf') return TipoMedia.DOCUMENTO;

    return TipoMedia.OTRO;
  }
}
