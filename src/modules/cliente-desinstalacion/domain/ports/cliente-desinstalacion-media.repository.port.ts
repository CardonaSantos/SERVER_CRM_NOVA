import { ClienteDesinstalacionMediaEntity } from '../entities/cliente-desinstalacion-media.entity';

export type ClienteDesinstalacionMediaWithMedia = {
  evidencia: ClienteDesinstalacionMediaEntity;

  media?: {
    id: number;

    cdnUrl?: string | null;

    key: string;

    mimeType?: string | null;

    extension?: string | null;

    tamanioBytes?: bigint | null;
  };
};

export interface ClienteDesinstalacionMediaRepositoryPort {
  create(
    entity: ClienteDesinstalacionMediaEntity,
  ): Promise<ClienteDesinstalacionMediaEntity>;

  findByDesinstalacion(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionMediaWithMedia[]>;

  delete(id: number): Promise<void>;
}
