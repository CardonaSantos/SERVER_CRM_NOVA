import { Inject, Injectable, Logger } from '@nestjs/common';
import { PLANTILLA_LEGAL_REPOSITORY } from '../domain/plantilla-legal.repository';
import { PlantillaLegalRepository } from '../domain/plantilla-legal.repository';
import { PlantillaLegal } from '../entities/plantilla-legal.entity';
import { CreatePlantillaLegalDto } from '../dto/create-plantilla-legal.dto';
import { UpdatePlantillaLegalDto } from '../dto/update-plantilla-legal.dto';

@Injectable()
export class PlantillaLegalService {
  private readonly logger = new Logger(PlantillaLegalService.name);

  constructor(
    @Inject(PLANTILLA_LEGAL_REPOSITORY)
    private readonly repo: PlantillaLegalRepository,
  ) {}

  async create(dto: CreatePlantillaLegalDto): Promise<PlantillaLegal> {
    this.logger.log(`Creando plantilla legal: ${dto.nombre}`);

    const plantilla = PlantillaLegal.crear({
      tipo: dto.tipo,
      nombre: dto.nombre,
      contenido: dto.contenido,
      version: dto.version,
    });

    return this.repo.create(plantilla);
  }

  async findById(id: number): Promise<PlantillaLegal> {
    return this.repo.findById(id);
  }

  async findMany(params?: {
    tipo?: string;
    soloActivas?: boolean;
  }): Promise<PlantillaLegal[]> {
    return this.repo.findMany({
      tipo: params?.tipo as any,
      soloActivas: params?.soloActivas,
    });
  }

  async update(
    id: number,
    dto: UpdatePlantillaLegalDto,
  ): Promise<PlantillaLegal> {
    const actual = await this.repo.findById(id);

    const actualizada = actual.actualizarContenido({
      contenido: dto.contenido,
      version: dto.version,
    });

    return this.repo.update(actualizada);
  }

  async activar(id: number): Promise<void> {
    await this.repo.activar(id);
  }

  async desactivar(id: number): Promise<void> {
    await this.repo.desactivar(id);
  }

  async getHTML(creditoId: number, plantillaId: number) {
    return await this.repo.getPlantillasToComprobante(creditoId, plantillaId);
  }
}
