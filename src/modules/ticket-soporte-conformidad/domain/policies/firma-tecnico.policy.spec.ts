import { TicketConformidadEntity } from '../entities/ticket-conformidad.entity';
import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import {
  TicketConformidadContextoIncompletoError,
  TicketConformidadEstadoInvalidoError,
  TicketConformidadProhibidaError,
} from '../errors/ticket-soporte-conformidad.errors';
import { exigirFirmaTecnicaPermitida } from './firma-tecnico.policy';

const AHORA = new Date('2026-11-25T15:00:00.000Z');

function conformidad(
  cambios: {
    resultado?: TicketConformidadResultado;
    clienteId?: number | null;
    tecnicoAsignadoId?: number | null;
  } = {},
) {
  const resultado = cambios.resultado ?? TicketConformidadResultado.PENDIENTE;

  return TicketConformidadEntity.hydrate({
    id: 1,
    ticketId: 10,
    clienteId: cambios.clienteId === undefined ? 5 : cambios.clienteId,
    tecnicoAsignadoId:
      cambios.tecnicoAsignadoId === undefined ? 7 : cambios.tecnicoAsignadoId,
    creadoPorId: 3,
    resultado,
    creadoEn: AHORA,
    actualizadoEn: AHORA,
    respondidoEn:
      resultado === TicketConformidadResultado.PENDIENTE ? null : AHORA,
  });
}

describe('exigirFirmaTecnicaPermitida', () => {
  it('el técnico asignado firma una conformidad pendiente y obtiene el cliente del ciclo', () => {
    expect(exigirFirmaTecnicaPermitida(conformidad(), 7)).toEqual({
      clienteId: 5,
    });
  });

  it('también puede firmar cuando el cliente ya quedó conforme (cualquier orden)', () => {
    expect(
      exigirFirmaTecnicaPermitida(
        conformidad({ resultado: TicketConformidadResultado.CONFORME }),
        7,
      ),
    ).toEqual({ clienteId: 5 });
  });

  it('no se firma una conformidad que requiere retrabajo', () => {
    expect(() =>
      exigirFirmaTecnicaPermitida(
        conformidad({
          resultado: TicketConformidadResultado.REQUIERE_RETRABAJO,
        }),
        7,
      ),
    ).toThrow(TicketConformidadEstadoInvalidoError);
  });

  it('sin técnico asignado no hay quién firme', () => {
    expect(() =>
      exigirFirmaTecnicaPermitida(conformidad({ tecnicoAsignadoId: null }), 7),
    ).toThrow(TicketConformidadContextoIncompletoError);
  });

  it('otro usuario distinto del asignado recibe 403 de dominio', () => {
    expect(() => exigirFirmaTecnicaPermitida(conformidad(), 8)).toThrow(
      TicketConformidadProhibidaError,
    );
  });

  it('sin cliente en el ciclo no se puede guardar la firma', () => {
    expect(() =>
      exigirFirmaTecnicaPermitida(conformidad({ clienteId: null }), 7),
    ).toThrow(TicketConformidadContextoIncompletoError);
  });
});
