import { Money } from 'src/common/hexagonal/money.vo';
import { EstadoDesinstalacionCliente } from '../enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../enums/tipo-desinstalacion-cliente.enum';
import {
  ClienteDesinstalacionDatosInvalidosError,
  ClienteDesinstalacionEstadoInvalidoError,
} from '../errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionEntity } from './cliente-desinstalacion.entity';

const SOLICITUD = new Date('2026-11-20T10:00:00.000Z');
const INICIO = new Date('2026-11-25T14:00:00.000Z');
const FIN = new Date('2026-11-25T16:00:00.000Z');

function nueva(extra: Record<string, unknown> = {}) {
  return ClienteDesinstalacionEntity.create({
    empresaId: 1,
    clienteId: 7,
    fechaSolicitud: SOLICITUD,
    ...extra,
  });
}

/** Una desinstalación ya guardada, en el estado pedido y con fechas coherentes. */
function guardada(estado: EstadoDesinstalacionCliente) {
  const base = nueva().toPrimitives();
  const fechas: Record<string, Date | null> = {
    fechaInicio: null,
    fechaFinalizacion: null,
    fechaCancelacion: null,
  };

  if (estado !== EstadoDesinstalacionCliente.PROGRAMADA)
    fechas.fechaInicio = INICIO;
  if (
    estado === EstadoDesinstalacionCliente.COMPLETADA ||
    estado === EstadoDesinstalacionCliente.FALLIDA
  ) {
    fechas.fechaFinalizacion = FIN;
  }
  if (estado === EstadoDesinstalacionCliente.CANCELADA) {
    fechas.fechaInicio = null;
    fechas.fechaCancelacion = FIN;
  }

  return ClienteDesinstalacionEntity.hydrate({
    ...base,
    id: 10,
    estado,
    ...fechas,
  });
}

describe('ClienteDesinstalacionEntity', () => {
  describe('create', () => {
    it('nace PROGRAMADA, tipo COMPLETA, retira equipo y con costos en cero; usa la fecha recibida', () => {
      const p = nueva().toPrimitives();

      expect(p).toMatchObject({
        estado: EstadoDesinstalacionCliente.PROGRAMADA,
        tipo: TipoDesinstalacionCliente.COMPLETA,
        requiereRetiroEquipo: true,
        equipoRecuperado: false,
        fechaSolicitud: SOLICITUD,
      });
      expect(p.costoDesinstalacion.toNumber()).toBe(0);
    });

    it('rechaza ids inválidos y coordenadas incompletas o fuera de rango', () => {
      expect(() => nueva({ clienteId: 0 })).toThrow(
        ClienteDesinstalacionDatosInvalidosError,
      );
      expect(() => nueva({ latitud: 14.6 })).toThrow('juntas');
      expect(() => nueva({ latitud: 99, longitud: 0 })).toThrow('latitud');
      expect(() => nueva({ latitud: 0, longitud: 200 })).toThrow('longitud');
    });
  });

  describe('iniciar', () => {
    it('PROGRAMADA pasa a EN_PROCESO con la fecha recibida y registra al ejecutor', () => {
      const e = guardada(EstadoDesinstalacionCliente.PROGRAMADA);

      e.iniciar({ ejecutadoPorId: 3, fechaInicio: INICIO });

      expect(e.estado).toBe(EstadoDesinstalacionCliente.EN_PROCESO);
      expect(e.toPrimitives()).toMatchObject({
        ejecutadoPorId: 3,
        fechaInicio: INICIO,
      });
    });

    it('no puede ser anterior a la solicitud ni desde otro estado', () => {
      expect(() =>
        guardada(EstadoDesinstalacionCliente.PROGRAMADA).iniciar({
          fechaInicio: new Date('2026-01-01T00:00:00Z'),
        }),
      ).toThrow('anterior a fechaSolicitud');
      expect(() =>
        guardada(EstadoDesinstalacionCliente.EN_PROCESO).iniciar({
          fechaInicio: INICIO,
        }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });

    it('una desinstalación sin guardar no puede iniciarse', () => {
      expect(() => nueva().iniciar({ fechaInicio: INICIO })).toThrow(
        'aún no ha sido guardada',
      );
    });
  });

  describe('completar', () => {
    it('EN_PROCESO pasa a COMPLETADA con resultado y conformidad', () => {
      const e = guardada(EstadoDesinstalacionCliente.EN_PROCESO);

      e.completar({
        ejecutadoPorId: 3,
        fechaFinalizacion: FIN,
        resultado: ' retirado ',
        equipoRecuperado: true,
        conforme: true,
      });

      expect(e.toPrimitives()).toMatchObject({
        estado: EstadoDesinstalacionCliente.COMPLETADA,
        fechaFinalizacion: FIN,
        resultado: 'retirado',
        equipoRecuperado: true,
        conforme: true,
      });
    });

    it('no antes del inicio ni desde PROGRAMADA', () => {
      expect(() =>
        guardada(EstadoDesinstalacionCliente.EN_PROCESO).completar({
          ejecutadoPorId: 3,
          fechaFinalizacion: new Date('2026-11-25T10:00:00Z'),
        }),
      ).toThrow('anterior a fechaInicio');
      expect(() =>
        guardada(EstadoDesinstalacionCliente.PROGRAMADA).completar({
          ejecutadoPorId: 3,
          fechaFinalizacion: FIN,
        }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('marcarFallida', () => {
    it('solo desde EN_PROCESO; puede cambiar el motivo', () => {
      const e = guardada(EstadoDesinstalacionCliente.EN_PROCESO);

      e.marcarFallida({
        fechaFinalizacion: FIN,
        motivo: MotivoDesinstalacionCliente.CLIENTE_NO_LOCALIZADO,
      });

      expect(e.toPrimitives()).toMatchObject({
        estado: EstadoDesinstalacionCliente.FALLIDA,
        motivo: MotivoDesinstalacionCliente.CLIENTE_NO_LOCALIZADO,
      });
      expect(() =>
        guardada(EstadoDesinstalacionCliente.PROGRAMADA).marcarFallida({
          fechaFinalizacion: FIN,
        }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('cancelar', () => {
    it.each([
      EstadoDesinstalacionCliente.PROGRAMADA,
      EstadoDesinstalacionCliente.EN_PROCESO,
    ])('desde %s pasa a CANCELADA con la fecha recibida', (estado) => {
      const e = guardada(estado);

      e.cancelar({ fechaCancelacion: FIN, observaciones: ' x ' });

      expect(e.toPrimitives()).toMatchObject({
        estado: EstadoDesinstalacionCliente.CANCELADA,
        fechaCancelacion: FIN,
        observaciones: 'x',
        fechaFinalizacion: null,
      });
    });

    it.each([
      EstadoDesinstalacionCliente.COMPLETADA,
      EstadoDesinstalacionCliente.CANCELADA,
      EstadoDesinstalacionCliente.FALLIDA,
    ])('no se cancela desde %s', (estado) => {
      expect(() =>
        guardada(estado).cancelar({ fechaCancelacion: FIN }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('reprogramar', () => {
    it('solo PROGRAMADA; valida la fecha', () => {
      const e = guardada(EstadoDesinstalacionCliente.PROGRAMADA);

      e.reprogramar({
        fechaProgramada: FIN,
        motivo: MotivoDesinstalacionCliente.OTRO,
      });

      expect(e.toPrimitives().fechaProgramada).toEqual(FIN);
      expect(() => e.reprogramar({ fechaProgramada: new Date('x') })).toThrow(
        'fecha válida',
      );
      expect(() =>
        guardada(EstadoDesinstalacionCliente.EN_PROCESO).reprogramar({
          fechaProgramada: FIN,
        }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('autorización', () => {
    it('autorizar solo valida y deja la desinstalación PROGRAMADA', () => {
      const e = guardada(EstadoDesinstalacionCliente.PROGRAMADA);

      e.autorizar();

      expect(e.estado).toBe(EstadoDesinstalacionCliente.PROGRAMADA);
      expect(() =>
        guardada(EstadoDesinstalacionCliente.EN_PROCESO).autorizar(),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });

    it('rechazar la autorización cancela con la fecha recibida', () => {
      const e = guardada(EstadoDesinstalacionCliente.PROGRAMADA);

      e.rechazarAutorizacion(FIN);

      expect(e.toPrimitives()).toMatchObject({
        estado: EstadoDesinstalacionCliente.CANCELADA,
        fechaCancelacion: FIN,
      });
      expect(() =>
        guardada(EstadoDesinstalacionCliente.COMPLETADA).rechazarAutorizacion(
          FIN,
        ),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('registrarFirma', () => {
    it('EN_PROCESO o COMPLETADA; exige quién firma', () => {
      const e = guardada(EstadoDesinstalacionCliente.EN_PROCESO);

      e.registrarFirma({
        firmadoPor: ' Ana ',
        dpiFirmante: ' ',
        conforme: true,
      });

      expect(e.toPrimitives()).toMatchObject({
        firmadoPor: 'Ana',
        dpiFirmante: null,
        conforme: true,
      });
      expect(() =>
        e.registrarFirma({ firmadoPor: ' ', conforme: true }),
      ).toThrow('firmadoPor es obligatorio');
      expect(() =>
        guardada(EstadoDesinstalacionCliente.PROGRAMADA).registrarFirma({
          firmadoPor: 'A',
          conforme: true,
        }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });
  });

  describe('edición', () => {
    it('no se edita una desinstalación finalizada', () => {
      expect(() =>
        guardada(
          EstadoDesinstalacionCliente.COMPLETADA,
        ).actualizarDatosGenerales({ observaciones: 'x' }),
      ).toThrow('No se puede editar');
      expect(() =>
        guardada(EstadoDesinstalacionCliente.CANCELADA).actualizarCostos({
          costoOtros: Money.fromNumber(1),
        }),
      ).toThrow(ClienteDesinstalacionEstadoInvalidoError);
    });

    it('el acceso y el servicio solo cambian mientras está PROGRAMADA', () => {
      expect(() =>
        guardada(
          EstadoDesinstalacionCliente.EN_PROCESO,
        ).actualizarDatosGenerales({ accesoInternetId: 5 }),
      ).toThrow('solo pueden modificarse');
      expect(() =>
        guardada(
          EstadoDesinstalacionCliente.PROGRAMADA,
        ).actualizarDatosGenerales({ accesoInternetId: 5 }),
      ).not.toThrow();
    });

    it('rechaza montos negativos', () => {
      expect(() =>
        guardada(EstadoDesinstalacionCliente.PROGRAMADA).actualizarCostos({
          costoTransporte: Money.fromNumber(-5),
        }),
      ).toThrow('no puede ser negativo');
    });
  });

  it('toPrimitives devuelve una copia', () => {
    const e = guardada(EstadoDesinstalacionCliente.PROGRAMADA);

    e.toPrimitives().estado = EstadoDesinstalacionCliente.COMPLETADA;

    expect(e.estado).toBe(EstadoDesinstalacionCliente.PROGRAMADA);
  });
});
