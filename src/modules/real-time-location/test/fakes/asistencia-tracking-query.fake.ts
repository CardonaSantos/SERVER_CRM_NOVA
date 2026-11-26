import {
  AsistenciaTrackingQueryPort,
  AsistenciaTrackingRecord,
} from '../../domain/ports/asistencia-tracking-query.port';

export class AsistenciaTrackingQueryFake
  implements AsistenciaTrackingQueryPort
{
  readonly filas = new Map<number, AsistenciaTrackingRecord>();

  sembrar(
    cambios: Partial<AsistenciaTrackingRecord> = {},
  ): AsistenciaTrackingRecord {
    const asistencia: AsistenciaTrackingRecord = {
      id: 50,
      tecnicoId: 7,
      fecha: new Date('2026-11-25T00:00:00.000Z'),
      horaEntrada: new Date('2026-11-25T14:00:00.000Z'),
      horaSalida: null,
      minutosTarde: null,
      trabajoCompleto: false,
      creadoEn: null,
      actualizadoEn: new Date('2026-11-25T14:00:00.000Z'),
      ...cambios,
    };

    this.filas.set(asistencia.id, asistencia);

    return asistencia;
  }

  findByTechnicianAndDate(): Promise<AsistenciaTrackingRecord | null> {
    return Promise.resolve(null);
  }

  findById(id: number): Promise<AsistenciaTrackingRecord | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }
}
