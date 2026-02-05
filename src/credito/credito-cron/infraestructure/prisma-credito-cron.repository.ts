import { Injectable, Logger } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreditoCronRepository } from '../domain/credito-cron.repository';

@Injectable()
export class PrismaCreditoCronRepository implements CreditoCronRepository {
  private readonly logger = new Logger(PrismaCreditoCronRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async generateMoraCreditoCuota() {
    const hoy = new Date();

    const creditosActivos = await this.prisma.credito.findMany({
      where: {
        estado: 'ACTIVO',
        interesMoraPorcentaje: { gt: 0 },
      },
      include: {
        cuotas: {
          where: {
            estado: { not: 'PAGADA' },
            fechaVenc: { lt: hoy },
          },
          include: {
            moras: {
              orderBy: { calculadoEn: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const resultados = [];

    for (const credito of creditosActivos) {
      if (credito.cuotas.length === 0) continue;

      const moraProcesada = await this.calculateMora(
        credito.cuotas,
        credito.interesMoraPorcentaje,
      );
      resultados.push(moraProcesada);
    }

    return resultados;
  }

  async calculateMora(cuotas: any[], interesMoraPorcentaje: Decimal) {
    const hoy = new Date().setHours(0, 0, 0, 0);

    for (const cuota of cuotas) {
      const ultimaMora = cuota.moras[0];
      if (ultimaMora) {
        const fechaUltimaMora = new Date(ultimaMora.calculadoEn).setHours(
          0,
          0,
          0,
          0,
        );
        if (fechaUltimaMora === hoy) continue;
      }

      const record = await this.increaseMoraCuota(cuota, interesMoraPorcentaje);
      this.logger.log(
        `La cuota con mora es: \n${JSON.stringify(record, null, 2)}`,
      );
    }
  }

  async increaseMoraCuota(cuota: any, tasaMora: Decimal) {
    const montoBase = cuota.montoCapital; // o montoTotal si lo decides
    const montoMoraDiaria = montoBase.mul(tasaMora.div(100));
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const vencimiento = new Date(cuota.fechaVenc);
    vencimiento.setHours(0, 0, 0, 0);
    const diasMora = Math.max(
      Math.floor((hoy.getTime() - vencimiento.getTime()) / 86400000),
      0,
    );

    return await this.prisma.$transaction(async (tx) => {
      const newMora = await tx.moraCredito.create({
        data: {
          interes: montoMoraDiaria,
          diasMora,
          cuotaId: cuota.id,
          calculadoEn: new Date(),
          estado: 'PENDIENTE',
        },
      });

      await tx.cuotaCredito.update({
        where: { id: cuota.id },
        data: {
          estado: 'VENCIDA',
        },
      });

      return newMora;
    });
  }
}
