import { ClienteInstalacionMediaEntity } from '../entities/cliente-instalacion-media.entity';

export type ClienteInstalacionMediaWithMedia = {
  evidencia: ClienteInstalacionMediaEntity;
  media?: {
    id: number;
    cndUrl?: string | null;
    key: string;
    mimeType?: string | null;
    extension?: string | null;
    tamanioBytes?: bigint | null;
  };
};

export interface ClienteInstalacionMediaRepositoryPort {
  create(
    entity: ClienteInstalacionMediaEntity,
  ): Promise<ClienteInstalacionMediaEntity>;

  findByInstalacion(
    instalacionId: number,
  ): Promise<Array<ClienteInstalacionMediaWithMedia>>;

  delete(id: number): Promise<void>;
}
