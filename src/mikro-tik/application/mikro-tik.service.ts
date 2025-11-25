import { Injectable, Logger } from '@nestjs/common';
import { CreateMikroTikDto } from '../dto/create-mikro-tik.dto';
import { UpdateMikroTikDto } from '../dto/update-mikro-tik.dto';
import { MikrotikRouterRepository } from '../domain/mikrotik-repository';
import { MikrotikRouter } from '../domain/mikrotik-entity';
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class MikroTikService {
  private readonly logger = new Logger(MikroTikService.name);
  constructor(private readonly mikrotikService: MikrotikRouterRepository) {}

  async create(dto: CreateMikroTikDto) {
    this.logger.log('el dto del create es: ', dto);
    const factoryEntity = MikrotikRouter.create({
      ...dto,
      sshPort: dto.sshPort,
      activo: dto.activo ?? true,
      empresaId: dto.empresaId,
    });

    return this.mikrotikService.create(factoryEntity);
  }
  // GET
  async getAll() {
    return this.mikrotikService.getAll();
  }

  async getById(id: number) {
    return this.mikrotikService.findById(id);
  }
  // DELETE
  async deleteAll() {
    return this.mikrotikService.deleteAll();
  }

  async deleteById(id: number) {
    return this.mikrotikService.deleteById(id);
  }
  // PATCH
  async update(id: number, dto: UpdateMikroTikDto) {
    return this.mikrotikService.update(id, dto);
  }
}
