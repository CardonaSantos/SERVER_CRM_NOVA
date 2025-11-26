import { UpdateMikroTikDto } from '../dto/update-mikro-tik.dto';
import { MikrotikRouter } from './mikrotik-entity';

export abstract class MikrotikRouterRepository {
  //POST
  abstract create(mikrotik: MikrotikRouter): Promise<MikrotikRouter>;
  //GETS
  abstract findById(id: number): Promise<MikrotikRouter | null>;
  abstract getAll(): Promise<Array<MikrotikRouter>>;
  //DELETE
  abstract deleteById(id: number): Promise<MikrotikRouter | null>;
  abstract deleteAll(): Promise<number>;
  //PATCH
  abstract update(dto: UpdateMikroTikDto): Promise<MikrotikRouter | null>;
}
