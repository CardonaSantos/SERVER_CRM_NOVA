import { EstadoAutorizacionDesinstalacion } from '../enums/estado-autorizacion-desinstalacion.enum';
import {
  AutorizacionDesinstalacionConflictoError,
  ClienteDesinstalacionDatosInvalidosError,
} from '../errors/cliente-desinstalacion.errors';
import { ClienteDesinstalacionAutorizacionEntity } from './cliente-desinstalacion-autorizacion.entity';

const AHORA = new Date('2026-11-25T15:00:00.000Z');
const RESPUESTA = new Date('2026-11-25T16:00:00.000Z');

function pendiente() {
  return ClienteDesinstalacionAutorizacionEntity.hydrate({
    ...ClienteDesinstalacionAutorizacionEntity.create(
      {
        desinstalacionId: 10,
        solicitadoPorId: 3,
        motivoSolicitud: ' por mora ',
      },
      AHORA,
    ).toPrimitives(),
    id: 1,
  });
}

describe('ClienteDesinstalacionAutorizacionEntity', () => {
  it('nace PENDIENTE con la fecha recibida y el motivo recortado', () => {
    const p = pendiente().toPrimitives();

    expect(p).toMatchObject({
      estado: EstadoAutorizacionDesinstalacion.PENDIENTE,
      fechaSolicitud: AHORA,
      motivoSolicitud: 'por mora',
      autorizadoPorId: null,
      fechaRespuesta: null,
    });
  });

  it('aprobar registra quién, el comentario y la fecha de respuesta', () => {
    const e = pendiente();

    e.aprobar({
      autorizadoPorId: 9,
      comentarioAutorizador: ' ok ',
      fechaRespuesta: RESPUESTA,
    });

    expect(e.toPrimitives()).toMatchObject({
      estado: EstadoAutorizacionDesinstalacion.APROBADA,
      autorizadoPorId: 9,
      comentarioAutorizador: 'ok',
      fechaRespuesta: RESPUESTA,
    });
  });

  it('rechazar deja la autorización RECHAZADA', () => {
    const e = pendiente();

    e.rechazar({ autorizadoPorId: 9, fechaRespuesta: RESPUESTA });

    expect(e.estado).toBe(EstadoAutorizacionDesinstalacion.RECHAZADA);
  });

  it('una autorización respondida no se responde de nuevo', () => {
    const e = pendiente();
    e.aprobar({ autorizadoPorId: 9, fechaRespuesta: RESPUESTA });

    expect(() =>
      e.rechazar({ autorizadoPorId: 9, fechaRespuesta: RESPUESTA }),
    ).toThrow(AutorizacionDesinstalacionConflictoError);
  });

  it('exige un autorizador válido', () => {
    expect(() =>
      pendiente().aprobar({ autorizadoPorId: 0, fechaRespuesta: RESPUESTA }),
    ).toThrow(ClienteDesinstalacionDatosInvalidosError);
  });
});
