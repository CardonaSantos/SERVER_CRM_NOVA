import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, TipoPlantillaLegal } from '@prisma/client';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PlantillaLegalRepository } from '../domain/plantilla-legal.repository';
import { PlantillaLegal } from '../entities/plantilla-legal.entity';
import { PlantillaLegalMapper } from '../common/plantilla-legal-mappers';
import { buildContratoVariables, renderPlantilla } from '../helpers/helpers';

@Injectable()
export class PrismaPlantillaLegalRepository
  implements PlantillaLegalRepository
{
  private readonly logger = new Logger(PrismaPlantillaLegalRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(plantilla: PlantillaLegal): Promise<PlantillaLegal> {
    try {
      const data = PlantillaLegalMapper.toPersistence(plantilla);

      const record = await this.prisma.plantillaLegal.create({
        data,
      });

      return PlantillaLegalMapper.toDomain(record);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaPlantillaLegalRepository.create',
      );
    }
  }

  async findById(id: number): Promise<PlantillaLegal> {
    try {
      const record = await this.prisma.plantillaLegal.findUnique({
        where: { id },
      });

      if (!record) {
        throw new NotFoundException(
          `Plantilla legal con ID ${id} no encontrada`,
        );
      }

      return PlantillaLegalMapper.toDomain(record);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throwFatalError(
        error,
        this.logger,
        'PrismaPlantillaLegalRepository.findById',
      );
    }
  }

  async findMany(params?: {
    tipo?: TipoPlantillaLegal;
    soloActivas?: boolean;
  }): Promise<PlantillaLegal[]> {
    try {
      const records = await this.prisma.plantillaLegal.findMany({
        where: {
          tipo: params?.tipo,
          activa: params?.soloActivas ? true : undefined,
        },
        orderBy: { creadoEn: 'desc' },
      });

      return records.map(PlantillaLegalMapper.toDomain);
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaPlantillaLegalRepository.findMany',
      );
    }
  }

  async update(plantilla: PlantillaLegal): Promise<PlantillaLegal> {
    try {
      const data = PlantillaLegalMapper.toPersistence(plantilla);

      const record = await this.prisma.plantillaLegal.update({
        where: { id: plantilla.id },
        data,
      });

      return PlantillaLegalMapper.toDomain(record);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `No se pudo actualizar: ID ${plantilla.id} no existe`,
        );
      }

      throwFatalError(
        error,
        this.logger,
        'PrismaPlantillaLegalRepository.update',
      );
    }
  }

  async activar(id: number): Promise<void> {
    await this.setActiva(id, true);
  }

  async desactivar(id: number): Promise<void> {
    await this.setActiva(id, false);
  }

  private async setActiva(id: number, activa: boolean): Promise<void> {
    try {
      await this.prisma.plantillaLegal.update({
        where: { id },
        data: { activa },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(
          `Plantilla legal con ID ${id} no encontrada`,
        );
      }

      throwFatalError(
        error,
        this.logger,
        'PrismaPlantillaLegalRepository.setActiva',
      );
    }
  }

  async getPlantillasToComprobante(creditoId: number, plantillaId: number) {
    try {
      const empresa = await this.prisma.empresa.findFirst({});
      if (!empresa) throw new Error('Empresa no configurada');

      const credito = await this.prisma.credito.findUnique({
        where: { id: creditoId },
        include: {
          cliente: {
            include: {
              municipio: true,
              departamento: true,
            },
          },
          cuotas: {
            include: { moras: true },
          },
          pagos: true,
        },
      });

      // LOG DE CONTROL
      this.logger.debug(`Datos de Prisma: ${JSON.stringify(credito)}`);

      if (!credito) throw new Error('Crédito no encontrado');

      if (!credito) throw new Error('Crédito no encontrado');

      const plantilla = await this.prisma.plantillaLegal.findUnique({
        where: { id: plantillaId },
      });

      if (!plantilla) throw new Error('Plantilla no encontrada');

      const variables = buildContratoVariables({
        empresa,
        credito,
      });

      const htmlFinal = renderPlantilla(plantilla.contenido, variables);

      return {
        plantillaId: plantilla.id,
        creditoId,
        html: htmlFinal,
      };
    } catch (error) {
      throwFatalError(
        error,
        this.logger,
        'PrismaPlantillaLegalRepository.getPlantillasToComprobante',
      );
    }
  }
}
