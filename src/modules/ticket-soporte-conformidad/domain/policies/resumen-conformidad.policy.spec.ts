import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';
import { TicketConformidadDetalleReadModel } from '../read-models/ticket-soporte-conformidad.read-model';
import {
  calcularResumenConformidad,
  calcularResumenHistorial,
  minutosDeRespuesta,
} from './resumen-conformidad.policy';

const T0 = new Date('2026-11-25T15:00:00.000Z');
const T1 = new Date('2026-11-25T15:30:45.000Z');

describe('resumen-conformidad.policy', () => {
  describe('minutosDeRespuesta', () => {
    it('sin respuesta es null', () => {
      expect(minutosDeRespuesta(T0, null)).toBeNull();
    });

    it('redondea hacia abajo a minutos enteros', () => {
      expect(minutosDeRespuesta(T0, T1)).toBe(30);
    });

    it('una respuesta anterior a la solicitud cuenta como 0', () => {
      expect(minutosDeRespuesta(T1, T0)).toBe(0);
    });
  });

  describe('calcularResumenConformidad', () => {
    it('pendiente sin firmas', () => {
      expect(
        calcularResumenConformidad({
          resultado: TicketConformidadResultado.PENDIENTE,
          creadoEn: T0,
          respondidoEn: null,
          firmas: [],
        }),
      ).toEqual({
        tieneFirmaCliente: false,
        tieneFirmaTecnico: false,
        firmaClienteEn: null,
        firmaTecnicoEn: null,
        cantidadFirmas: 0,
        requiereRetrabajo: false,
        estaConforme: false,
        estaPendiente: true,
        tiempoRespuestaMinutos: null,
      });
    });

    it('conforme con las dos firmas y tiempo de respuesta', () => {
      const resumen = calcularResumenConformidad({
        resultado: TicketConformidadResultado.CONFORME,
        creadoEn: T0,
        respondidoEn: T1,
        firmas: [
          { tipo: TicketFirmaTipo.TECNICO, firmadoEn: T0 },
          { tipo: TicketFirmaTipo.CLIENTE, firmadoEn: T1 },
        ],
      });

      expect(resumen).toMatchObject({
        tieneFirmaCliente: true,
        tieneFirmaTecnico: true,
        firmaClienteEn: T1,
        firmaTecnicoEn: T0,
        cantidadFirmas: 2,
        estaConforme: true,
        estaPendiente: false,
        tiempoRespuestaMinutos: 30,
      });
    });

    it('retrabajo', () => {
      expect(
        calcularResumenConformidad({
          resultado: TicketConformidadResultado.REQUIERE_RETRABAJO,
          creadoEn: T0,
          respondidoEn: T1,
          firmas: [],
        }).requiereRetrabajo,
      ).toBe(true);
    });
  });

  describe('calcularResumenHistorial', () => {
    const ciclo = (
      resultado: TicketConformidadResultado,
      creadoEn: Date,
      respondidoEn: Date | null,
      firmas: { tipo: TicketFirmaTipo; firmadoEn: Date }[] = [],
    ) =>
      ({
        resultado,
        creadoEn,
        respondidoEn,
        resumen: calcularResumenConformidad({
          resultado,
          creadoEn,
          respondidoEn,
          firmas,
        }),
      }) as unknown as TicketConformidadDetalleReadModel;

    it('sin ciclos todo queda en cero o null', () => {
      expect(calcularResumenHistorial([])).toEqual({
        totalSolicitudes: 0,
        totalConformes: 0,
        totalRetrabajos: 0,
        totalPendientes: 0,
        totalFirmasCliente: 0,
        totalFirmasTecnico: 0,
        requirioRetrabajoAlgunaVez: false,
        resultadoActual: null,
        primeraSolicitudEn: null,
        ultimaSolicitudEn: null,
        ultimaRespuestaEn: null,
        tiempoPromedioRespuestaMinutos: null,
      });
    });

    it('cuenta por resultado, promedia y toma el último ciclo como actual', () => {
      const T2 = new Date('2026-11-26T10:00:00.000Z');
      const T3 = new Date('2026-11-26T10:10:00.000Z');

      const resumen = calcularResumenHistorial([
        ciclo(TicketConformidadResultado.REQUIERE_RETRABAJO, T0, T1),
        ciclo(TicketConformidadResultado.CONFORME, T2, T3, [
          { tipo: TicketFirmaTipo.CLIENTE, firmadoEn: T3 },
          { tipo: TicketFirmaTipo.TECNICO, firmadoEn: T2 },
        ]),
        ciclo(
          TicketConformidadResultado.PENDIENTE,
          new Date('2026-11-27T10:00:00.000Z'),
          null,
        ),
      ]);

      expect(resumen).toMatchObject({
        totalSolicitudes: 3,
        totalConformes: 1,
        totalRetrabajos: 1,
        totalPendientes: 1,
        totalFirmasCliente: 1,
        totalFirmasTecnico: 1,
        requirioRetrabajoAlgunaVez: true,
        resultadoActual: TicketConformidadResultado.PENDIENTE,
        primeraSolicitudEn: T0,
        ultimaSolicitudEn: new Date('2026-11-27T10:00:00.000Z'),
        ultimaRespuestaEn: T3,
        tiempoPromedioRespuestaMinutos: 20,
      });
    });
  });
});
