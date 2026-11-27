import {
  MotivoCierreSesiones,
  SesionesUsuarioPort,
} from '../../application/ports/sesiones-usuario.port';

export class SesionesUsuarioFake implements SesionesUsuarioPort {
  readonly cierres: {
    usuarioId: number;
    excepto: string | null;
    motivo: MotivoCierreSesiones;
  }[] = [];

  cerrarTodas(
    usuarioId: number,
    motivo: MotivoCierreSesiones,
  ): Promise<number> {
    this.cierres.push({ usuarioId, excepto: null, motivo });
    return Promise.resolve(2);
  }

  cerrarOtras(
    usuarioId: number,
    sesionId: string,
    motivo: MotivoCierreSesiones,
  ): Promise<number> {
    this.cierres.push({ usuarioId, excepto: sesionId, motivo });
    return Promise.resolve(1);
  }
}
