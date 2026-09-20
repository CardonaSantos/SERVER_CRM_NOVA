import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  AsistenciaTrackingPort,
  AsistenciaTrackingRecord,
} from '../../domain/ports/asistencia-tracking.port';

@Injectable()
export class AsistenciaTrackingPrismaAdapter implements AsistenciaTrackingPort {
  constructor(private readonly prisma: PrismaService) {}

  // =====================================================
  // BUSCAR POR TECNICO + FECHA
  // =====================================================

  async findByTechnicianAndDate(params: {
    tecnicoId: number;
    fecha: Date;
  }): Promise<AsistenciaTrackingRecord | null> {
    const record = await this.prisma.asistencia.findUnique({
      where: {
        usuarioId_fecha: {
          usuarioId: params.tecnicoId,
          fecha: params.fecha,
        },
      },
    });

    if (!record) {
      return null;
    }

    return this.toRecord(record);
  }

  // =====================================================
  // BUSCAR POR ID
  // =====================================================

  async findById(id: number): Promise<AsistenciaTrackingRecord | null> {
    const record = await this.prisma.asistencia.findUnique({
      where: {
        id,
      },
    });

    if (!record) {
      return null;
    }

    return this.toRecord(record);
  }

  // =====================================================
  // MAPPING
  // =====================================================

  private toRecord(record: {
    id: number;
    usuarioId: number;

    fecha: Date;

    horaEntrada: Date;
    horaSalida: Date | null;

    minutosTarde: number | null;
    trabajoCompleto: boolean;

    creadoEn: Date | null;
    actualizadoEn: Date;
  }): AsistenciaTrackingRecord {
    return {
      id: record.id,

      tecnicoId: record.usuarioId,

      fecha: record.fecha,

      horaEntrada: record.horaEntrada,
      horaSalida: record.horaSalida,

      minutosTarde: record.minutosTarde,

      trabajoCompleto: record.trabajoCompleto,

      creadoEn: record.creadoEn,

      actualizadoEn: record.actualizadoEn,
    };
  }
}
