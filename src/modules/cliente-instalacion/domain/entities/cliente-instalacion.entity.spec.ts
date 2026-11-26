import { Money } from 'src/common/hexagonal/money.vo';
import { EstadoInstalacionCliente } from '../enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../enums/tipo-instalacion-cliente.enum';
import {
  ClienteInstalacionDatosInvalidosError,
  ClienteInstalacionEstadoInvalidoError,
} from '../errors/cliente-instalacion.errors';
import { ClienteInstalacionEntity } from './cliente-instalacion.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const MAS_TARDE = new Date('2026-11-25T18:00:00.000Z');

function nueva(extra: Record<string, unknown> = {}) {
  return ClienteInstalacionEntity.create({
    empresaId: 1,
    clienteId: 7,
    creadoPorId: 3,
    ...extra,
  });
}

function guardada(estado: EstadoInstalacionCliente, extra = {}) {
  return ClienteInstalacionEntity.hydrate({
    ...nueva().toPrimitives(),
    id: 10,
    estado,
    ...extra,
  });
}

describe('ClienteInstalacionEntity', () => {
  describe('create', () => {
    it('nace PROGRAMADA, tipo NUEVA y con costos en cero', () => {
      const p = nueva().toPrimitives();

      expect(p.estado).toBe(EstadoInstalacionCliente.PROGRAMADA);
      expect(p.tipo).toBe(TipoInstalacionCliente.NUEVA);
      expect(p.costoInstalacion.toNumber()).toBe(0);
      expect(p.completadoPorId).toBeNull();
    });

    it('rechaza ids inválidos', () => {
      expect(() => nueva({ clienteId: 0 })).toThrow(
        ClienteInstalacionDatosInvalidosError,
      );
    });

    it('latitud y longitud van juntas', () => {
      expect(() => nueva({ latitud: 14.6 })).toThrow(
        'también debe proporcionarse longitud',
      );
      expect(() => nueva({ longitud: -90 })).toThrow(
        'también debe proporcionarse latitud',
      );
      expect(() => nueva({ latitud: 14.6, longitud: -90 })).not.toThrow();
    });

    it('rechaza montos negativos', () => {
      expect(() => nueva({ costos: { costoOtros: -1 } })).toThrow(
        'no puede ser negativo',
      );
    });
  });

  describe('hydrate', () => {
    it('no comparte el objeto de props con quien lo entrega', () => {
      const props = { ...nueva().toPrimitives(), id: 5 };
      const entidad = ClienteInstalacionEntity.hydrate(props);

      entidad.reprogramar({ fechaProgramada: AHORA });

      expect(props.estado).toBe(EstadoInstalacionCliente.PROGRAMADA);
    });
  });

  describe('reprogramar', () => {
    it.each([
      EstadoInstalacionCliente.PROGRAMADA,
      EstadoInstalacionCliente.REPROGRAMADA,
    ])('desde %s pasa a REPROGRAMADA con motivo recortado', (estado) => {
      const e = guardada(estado);

      e.reprogramar({ fechaProgramada: MAS_TARDE, motivo: '  lluvia ' });

      expect(e.estado).toBe(EstadoInstalacionCliente.REPROGRAMADA);
      expect(e.fechaProgramada).toEqual(MAS_TARDE);
      expect(e.toPrimitives().motivo).toBe('lluvia');
    });

    it('no se puede desde EN_PROCESO ni sin haber sido guardada', () => {
      expect(() =>
        guardada(EstadoInstalacionCliente.EN_PROCESO).reprogramar({
          fechaProgramada: AHORA,
        }),
      ).toThrow(ClienteInstalacionEstadoInvalidoError);
      expect(() => nueva().reprogramar({ fechaProgramada: AHORA })).toThrow(
        'aún no ha sido guardada',
      );
    });
  });

  describe('iniciar', () => {
    it('pasa a EN_PROCESO con la fecha recibida', () => {
      const e = guardada(EstadoInstalacionCliente.PROGRAMADA);

      e.iniciar({ fechaInicio: AHORA });

      expect(e.estado).toBe(EstadoInstalacionCliente.EN_PROCESO);
      expect(e.toPrimitives().fechaInicio).toEqual(AHORA);
    });

    it.each([
      EstadoInstalacionCliente.EN_PROCESO,
      EstadoInstalacionCliente.COMPLETADA,
      EstadoInstalacionCliente.CANCELADA,
    ])('no se puede desde %s', (estado) => {
      expect(() => guardada(estado).iniciar({ fechaInicio: AHORA })).toThrow(
        ClienteInstalacionEstadoInvalidoError,
      );
    });
  });

  describe('completar', () => {
    it('solo desde EN_PROCESO; registra quién, cuándo y el resultado', () => {
      const e = guardada(EstadoInstalacionCliente.EN_PROCESO);

      e.completar({
        completadoPorId: 3,
        fechaFinalizacion: MAS_TARDE,
        resultado: ' ok ',
        observaciones: ' sin novedad ',
      });

      expect(e.estado).toBe(EstadoInstalacionCliente.COMPLETADA);
      expect(e.toPrimitives()).toMatchObject({
        completadoPorId: 3,
        fechaFinalizacion: MAS_TARDE,
        resultado: 'ok',
        observaciones: 'sin novedad',
      });
    });

    it('rechaza otros estados y fechas inválidas', () => {
      expect(() =>
        guardada(EstadoInstalacionCliente.PROGRAMADA).completar({
          completadoPorId: 3,
          fechaFinalizacion: AHORA,
        }),
      ).toThrow('Solo una instalación en proceso');
      expect(() =>
        guardada(EstadoInstalacionCliente.EN_PROCESO).completar({
          completadoPorId: 3,
          fechaFinalizacion: new Date('x'),
        }),
      ).toThrow(ClienteInstalacionDatosInvalidosError);
    });
  });

  describe('marcarServicioActivado', () => {
    it('vale EN_PROCESO o COMPLETADA y conserva la primera activación', () => {
      const e = guardada(EstadoInstalacionCliente.EN_PROCESO, {
        fechaInicio: AHORA,
      });

      e.marcarServicioActivado(MAS_TARDE);
      e.marcarServicioActivado(new Date('2027-01-01T00:00:00Z'));

      expect(e.toPrimitives().fechaActivacionServicio).toEqual(MAS_TARDE);
    });

    it('no puede ser anterior al inicio ni desde PROGRAMADA', () => {
      expect(() =>
        guardada(EstadoInstalacionCliente.EN_PROCESO, {
          fechaInicio: MAS_TARDE,
        }).marcarServicioActivado(AHORA),
      ).toThrow('anterior al inicio');
      expect(() =>
        guardada(EstadoInstalacionCliente.PROGRAMADA).marcarServicioActivado(
          AHORA,
        ),
      ).toThrow(ClienteInstalacionEstadoInvalidoError);
    });
  });

  describe('cancelar', () => {
    it('exige motivo y registra la fecha recibida', () => {
      const e = guardada(EstadoInstalacionCliente.PROGRAMADA);

      e.cancelar({
        motivo: ' cliente se arrepintió ',
        fechaCancelacion: AHORA,
      });

      expect(e.estado).toBe(EstadoInstalacionCliente.CANCELADA);
      expect(e.toPrimitives()).toMatchObject({
        motivo: 'cliente se arrepintió',
        fechaCancelacion: AHORA,
      });
    });

    it('rechaza motivo vacío, completada y ya cancelada', () => {
      expect(() =>
        guardada(EstadoInstalacionCliente.PROGRAMADA).cancelar({
          motivo: '  ',
          fechaCancelacion: AHORA,
        }),
      ).toThrow('motivo es obligatorio');
      expect(() =>
        guardada(EstadoInstalacionCliente.COMPLETADA).cancelar({
          motivo: 'x',
          fechaCancelacion: AHORA,
        }),
      ).toThrow('completada');
      expect(() =>
        guardada(EstadoInstalacionCliente.CANCELADA).cancelar({
          motivo: 'x',
          fechaCancelacion: AHORA,
        }),
      ).toThrow('ya está cancelada');
    });
  });

  describe('actualizar', () => {
    it('datos generales: normaliza texto y respeta null explícito', () => {
      const e = guardada(EstadoInstalacionCliente.PROGRAMADA);

      e.actualizarDatosGenerales({
        descripcion: '  casa azul ',
        observaciones: null,
        fechaProgramada: MAS_TARDE,
      });

      expect(e.toPrimitives()).toMatchObject({
        descripcion: 'casa azul',
        observaciones: null,
        fechaProgramada: MAS_TARDE,
      });
    });

    it('no se edita una instalación finalizada', () => {
      expect(() =>
        guardada(EstadoInstalacionCliente.COMPLETADA).actualizarDatosGenerales({
          descripcion: 'x',
        }),
      ).toThrow('No se puede editar');
      expect(() =>
        guardada(EstadoInstalacionCliente.CANCELADA).actualizarCostos({
          costoOtros: Money.fromNumber(1),
        }),
      ).toThrow(ClienteInstalacionEstadoInvalidoError);
    });

    it('lo cobrado no puede superar el costo total', () => {
      const e = guardada(EstadoInstalacionCliente.EN_PROCESO);

      expect(() =>
        e.actualizarCostos({
          costoInstalacion: Money.fromNumber(100),
          montoCobradoCliente: Money.fromNumber(150),
        }),
      ).toThrow('no puede ser mayor al costo total');

      expect(() =>
        e.actualizarCostos({
          costoInstalacion: Money.fromNumber(100),
          montoCobradoCliente: Money.fromNumber(100),
        }),
      ).not.toThrow();
    });
  });

  it('toPrimitives devuelve una copia', () => {
    const e = guardada(EstadoInstalacionCliente.PROGRAMADA);

    e.toPrimitives().estado = EstadoInstalacionCliente.COMPLETADA;

    expect(e.estado).toBe(EstadoInstalacionCliente.PROGRAMADA);
  });
});
