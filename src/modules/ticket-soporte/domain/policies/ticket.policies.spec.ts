import { AccionTicket } from '../enums/accion-ticket.enum';
import { BandejaTicket } from '../enums/bandeja-ticket.enum';
import { EstadoTicket } from '../enums/estado-ticket.enum';
import { FaseTicket } from '../enums/fase-ticket.enum';
import {
  ComentarioImagenInvalidaError,
  TicketAccionDeOficinaError,
  TicketAccionNoPermitidaError,
  TicketNoAsignadoError,
} from '../errors/ticket-soporte.errors';
import { accionesDisponibles, exigirAccion } from './acciones-ticket.policy';
import { interpretarBusqueda } from './busqueda-ticket.policy';
import { contarBandejas, estadosDeBandeja, faseDe } from './fase-ticket.policy';
import { validarImagenes } from './imagen-comentario.policy';
import { duracionCiclo, tiempoTecnico } from './tiempos-ticket.policy';

const OFICINA = { gestiona: true, asignado: false };
const ASIGNADO = { gestiona: false, asignado: true };

describe('fases y bandejas', () => {
  it('los estados antiguos caen en las fases actuales', () => {
    expect(faseDe(EstadoTicket.NUEVO)).toBe(FaseTicket.ABIERTA);
    expect(faseDe(EstadoTicket.PENDIENTE_CLIENTE)).toBe(FaseTicket.ABIERTA);
    expect(faseDe(EstadoTicket.ARCHIVADA)).toBe(FaseTicket.RESUELTA);
    expect(faseDe(EstadoTicket.CERRADO)).toBe(FaseTicket.RESUELTA);
  });

  it('ningún estado queda fuera de las bandejas', () => {
    const repartidos = [
      BandejaTicket.ACTIVOS,
      BandejaTicket.RESUELTOS,
      BandejaTicket.CANCELADOS,
    ].flatMap(estadosDeBandeja);

    expect(repartidos.sort()).toEqual(Object.values(EstadoTicket).sort());
  });

  it('las bandejas suman', () => {
    const c = contarBandejas(
      Object.values(EstadoTicket).map((estado) => ({ estado, total: 1 })),
    );

    expect(c.abiertos + c.enProceso + c.enRevision).toBe(c.activos);
    expect(c.activos + c.resueltos + c.cancelados).toBe(c.todos);
    expect(c.todos).toBe(11);
  });
});

describe('acciones', () => {
  it('el técnico asignado inicia lo abierto y entrega lo que está en proceso', () => {
    expect(() =>
      exigirAccion(AccionTicket.INICIAR, FaseTicket.ABIERTA, ASIGNADO),
    ).not.toThrow();
    expect(() =>
      exigirAccion(
        AccionTicket.ENVIAR_REVISION,
        FaseTicket.EN_PROCESO,
        ASIGNADO,
      ),
    ).not.toThrow();
    expect(() =>
      exigirAccion(AccionTicket.INICIAR, FaseTicket.EN_REVISION, ASIGNADO),
    ).toThrow(TicketAccionNoPermitidaError);
  });

  it('el técnico no resuelve ni cancela, ni toca tickets ajenos', () => {
    expect(() =>
      exigirAccion(AccionTicket.RESOLVER, FaseTicket.EN_REVISION, ASIGNADO),
    ).toThrow(TicketAccionDeOficinaError);
    expect(() =>
      exigirAccion(AccionTicket.INICIAR, FaseTicket.ABIERTA, {
        gestiona: false,
        asignado: false,
      }),
    ).toThrow(TicketNoAsignadoError);
  });

  it('un ticket cerrado solo se reabre', () => {
    for (const fase of [FaseTicket.RESUELTA, FaseTicket.CANCELADA]) {
      expect(
        accionesDisponibles(fase, { ...OFICINA, tieneAsignados: true }),
      ).toEqual([AccionTicket.REABRIR]);
    }
  });

  it('no ofrece iniciar sin técnico', () => {
    expect(
      accionesDisponibles(FaseTicket.ABIERTA, {
        ...OFICINA,
        tieneAsignados: false,
      }),
    ).not.toContain(AccionTicket.INICIAR);
  });

  it('quien no es oficina ni está asignado no ve acciones', () => {
    expect(
      accionesDisponibles(FaseTicket.ABIERTA, {
        gestiona: false,
        asignado: false,
        tieneAsignados: true,
      }),
    ).toEqual([]);
  });
});

describe('tiempos', () => {
  const inicio = new Date('2026-11-27T15:00:00.000Z');
  const luego = new Date('2026-11-27T15:10:30.000Z');

  it('sin ciclos no es cero, es sin registro', () => {
    expect(tiempoTecnico([], luego)).toBeNull();
  });

  it('un ciclo cuenta al menos un minuto', () => {
    expect(duracionCiclo(inicio, inicio)).toBe(1);
  });

  it('suma los cerrados y el que sigue corriendo', () => {
    expect(
      tiempoTecnico(
        [
          { id: 1, inicio, fin: luego, duracionMinutos: 5 },
          { id: 2, inicio, fin: null, duracionMinutos: null },
        ],
        luego,
      ),
    ).toBe(15);
  });
});

describe('búsqueda', () => {
  it('un número corto es ticket', () => {
    expect(interpretarBusqueda('#42')).toMatchObject({
      id: 42,
      telefono: null,
    });
  });

  it('un teléfono no se trata como número de ticket imposible', () => {
    expect(interpretarBusqueda('55551234567')).toMatchObject({
      id: null,
      telefono: '55551234567',
    });
    expect(interpretarBusqueda('5555-1234')).toMatchObject({
      telefono: '55551234',
    });
  });

  it('un texto se separa en palabras para nombre y apellido', () => {
    expect(interpretarBusqueda('  ana  lópez ')?.palabras).toEqual([
      'ana',
      'lópez',
    ]);
    expect(interpretarBusqueda('   ')).toBeNull();
  });
});

describe('imágenes de comentarios', () => {
  const jpg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
  const webp = Buffer.from('RIFF0000WEBPVP8 ', 'latin1');
  const archivo = (bytes: Buffer) => ({ bytes, nombreArchivo: 'foto' });

  it('reconoce el tipo por el contenido', () => {
    expect(
      validarImagenes([archivo(jpg), archivo(webp)]).map((i) => i.mime),
    ).toEqual(['image/jpeg', 'image/webp']);
  });

  it('rechaza lo que no es imagen, aunque se llame así', () => {
    expect(() => validarImagenes([archivo(Buffer.from('<svg/>'))])).toThrow(
      ComentarioImagenInvalidaError,
    );
  });

  it('limita cantidad y peso', () => {
    expect(() => validarImagenes(Array(6).fill(archivo(jpg)))).toThrow(
      ComentarioImagenInvalidaError,
    );
    expect(() =>
      validarImagenes([
        archivo(Buffer.concat([jpg, Buffer.alloc(8 * 1024 * 1024)])),
      ]),
    ).toThrow(ComentarioImagenInvalidaError);
  });
});
