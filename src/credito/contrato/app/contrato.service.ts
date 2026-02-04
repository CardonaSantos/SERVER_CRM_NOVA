import { Inject, Injectable, Logger } from '@nestjs/common';
import { CreateContratoDto } from '../dto/create-contrato.dto';
import { UpdateContratoDto } from '../dto/update-contrato.dto';
import {
  CONTRATO_CREDITO_REPOSITORY,
  ContratoCreditoRepository,
} from '../domain/contrato-credito.repository';
import { Contrato } from '../entities/contrato.entity';

@Injectable()
export class ContratoService {
  private readonly logger = new Logger(ContratoService.name);

  constructor(
    @Inject(CONTRATO_CREDITO_REPOSITORY)
    private readonly repo: ContratoCreditoRepository,
  ) {}

  async create(dto: CreateContratoDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);

    const contrato = Contrato.crear({
      contenido: dto.contenido,
      creditoId: dto.creditoId,
      version: dto.version,
    });

    return await this.repo.create(contrato);
  }
  async findById(id: number) {
    return await this.repo.findById(id);
  }

  async deleteById(id: number) {
    return await this.repo.deleteById(id);
  }

  async deleteAll() {
    return await this.repo.deleteAll();
  }

  async findMany() {
    return await this.repo.findMany();
  }
}
