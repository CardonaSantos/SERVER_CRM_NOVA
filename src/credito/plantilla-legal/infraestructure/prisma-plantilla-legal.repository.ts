import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, TipoPlantillaLegal } from '@prisma/client';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PlantillaLegalRepository } from '../domain/plantilla-legal.repository';
import { PlantillaLegal } from '../entities/plantilla-legal.entity';
import { PlantillaLegalMapper } from '../common/plantilla-legal-mappers';

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
          cliente: true,
          cuotas: {
            include: { moras: true },
          },
          pagos: true,
        },
      });

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

function siNo(value: boolean): string {
  return value ? 'Sí' : 'No';
}

export function buildContratoVariables(params: { empresa: any; credito: any }) {
  const { empresa, credito } = params;
  const cliente = credito.cliente;

  const cuotas = credito.cuotas ?? [];
  const cuotasPagadas = cuotas.filter((c) => c.estado === 'PAGADA').length;
  const cuotasPendientes = cuotas.filter(
    (c) => c.estado === 'PENDIENTE',
  ).length;
  const cuotasVencidas = cuotas.filter((c) => c.estado === 'VENCIDA').length;

  const moras = cuotas.flatMap((c) => c.moras ?? []);
  const totalDiasMora = moras.reduce((acc, m) => acc + m.diasMora, 0);
  const totalInteresMora = moras.reduce((acc, m) => acc + Number(m.interes), 0);

  const pagos = credito.pagos ?? [];
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.montoTotal), 0);
  const ultimoPago = pagos.at(-1);

  return {
    // CLIENTE
    'cliente.id': cliente.id,
    'cliente.nombre': cliente.nombre,
    'cliente.apellidos': cliente.apellidos,
    'cliente.nombreCompleto': `${cliente.nombre} ${cliente.apellidos}`,
    'cliente.dpi': cliente.dpi,
    'cliente.nit': cliente.nit,
    'cliente.telefono': cliente.telefono,
    'cliente.email': cliente.email,
    'cliente.direccion': cliente.direccion,
    'cliente.municipio': cliente.municipio,
    'cliente.departamento': cliente.departamento,

    // CREDITO
    'credito.id': credito.id,
    'credito.montoCapital': credito.montoCapital,
    'credito.montoTotal': credito.montoTotal,
    'credito.montoCuota': credito.montoCuota,
    'credito.plazoCuotas': credito.plazoCuotas,
    'credito.frecuencia': credito.frecuencia,
    'credito.estado': credito.estado,
    'credito.interesPorcentaje': credito.interesPorcentaje,
    'credito.interesMoraPorcentaje': credito.interesMoraPorcentaje,
    'credito.intervaloDias': credito.intervaloDias,
    'credito.interesTipo': credito.interesTipo,
    'credito.origen': credito.origen,
    'credito.observaciones': credito.observaciones ?? '',

    // CUOTAS
    'cuotas.total': cuotas.length,
    'cuotas.pagadas': cuotasPagadas,
    'cuotas.pendientes': cuotasPendientes,
    'cuotas.vencidas': cuotasVencidas,

    // MORA
    'mora.tieneMora': siNo(moras.length > 0),
    'mora.totalDias': totalDiasMora,
    'mora.montoTotal': totalInteresMora,
    'mora.interesTotal': totalInteresMora,

    // PAGOS
    'pagos.totalPagado': totalPagado,
    'pagos.numeroPagos': pagos.length,
    'pagos.fechaUltimoPago': ultimoPago?.fechaPago ?? '',

    // EMPRESA
    'empresa.nombre': empresa.nombre,
    'empresa.razonSocial': empresa.razonSocial,
    'empresa.nit': empresa.nit,
    'empresa.direccion': empresa.direccion,
    'empresa.telefono': empresa.telefono,
    'empresa.email': empresa.email,

    // FLAGS
    'flags.tieneEnganche': siNo(!!credito.engancheMonto),
    'flags.tieneMora': siNo(moras.length > 0),
    'flags.creditoActivo': siNo(credito.estado === 'ACTIVO'),
  };
}

export function renderPlantilla(
  template: string,
  variables: Record<string, any>,
): string {
  let html = template;

  for (const [key, value] of Object.entries(variables)) {
    const safeValue =
      value === null || value === undefined ? '' : String(value);

    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    html = html.replace(regex, safeValue);
  }

  return html;
}
