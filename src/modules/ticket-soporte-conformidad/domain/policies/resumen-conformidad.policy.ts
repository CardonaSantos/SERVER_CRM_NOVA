import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';
import {
  TicketConformidadDetalleReadModel,
  TicketConformidadHistorialReadModel,
} from '../read-models/ticket-soporte-conformidad.read-model';

export type DatosResumenConformidad = {
  resultado: TicketConformidadResultado;
  creadoEn: Date;
  respondidoEn: Date | null;
  firmas: readonly { tipo: TicketFirmaTipo; firmadoEn: Date }[];
};

/** Minutos enteros entre la solicitud y la respuesta; `null` si aún no hay respuesta. */
export function minutosDeRespuesta(
  creadoEn: Date,
  respondidoEn: Date | null,
): number | null {
  if (!respondidoEn) return null;

  const milisegundos = respondidoEn.getTime() - creadoEn.getTime();

  return milisegundos <= 0 ? 0 : Math.floor(milisegundos / 60_000);
}

/** Resumen de un ciclo de conformidad para la pantalla. */
export function calcularResumenConformidad(
  datos: DatosResumenConformidad,
): TicketConformidadDetalleReadModel['resumen'] {
  const firmaCliente = datos.firmas.find(
    (firma) => firma.tipo === TicketFirmaTipo.CLIENTE,
  );
  const firmaTecnico = datos.firmas.find(
    (firma) => firma.tipo === TicketFirmaTipo.TECNICO,
  );

  return {
    tieneFirmaCliente: firmaCliente !== undefined,
    tieneFirmaTecnico: firmaTecnico !== undefined,
    firmaClienteEn: firmaCliente?.firmadoEn ?? null,
    firmaTecnicoEn: firmaTecnico?.firmadoEn ?? null,
    cantidadFirmas: datos.firmas.length,
    requiereRetrabajo:
      datos.resultado === TicketConformidadResultado.REQUIERE_RETRABAJO,
    estaConforme: datos.resultado === TicketConformidadResultado.CONFORME,
    estaPendiente: datos.resultado === TicketConformidadResultado.PENDIENTE,
    tiempoRespuestaMinutos: minutosDeRespuesta(
      datos.creadoEn,
      datos.respondidoEn,
    ),
  };
}

/** Resumen de todos los ciclos de un ticket (de la más antigua a la más reciente). */
export function calcularResumenHistorial(
  conformidades: readonly TicketConformidadDetalleReadModel[],
): TicketConformidadHistorialReadModel['resumen'] {
  const contar = (resultado: TicketConformidadResultado) =>
    conformidades.filter((item) => item.resultado === resultado).length;

  const totalRetrabajos = contar(TicketConformidadResultado.REQUIERE_RETRABAJO);

  const tiempos = conformidades
    .map((item) => item.resumen.tiempoRespuestaMinutos)
    .filter((valor): valor is number => valor !== null);

  const primera = conformidades[0] ?? null;
  const ultima = conformidades[conformidades.length - 1] ?? null;

  const respuestas = conformidades
    .map((item) => item.respondidoEn)
    .filter((fecha): fecha is Date => fecha !== null);

  return {
    totalSolicitudes: conformidades.length,
    totalConformes: contar(TicketConformidadResultado.CONFORME),
    totalRetrabajos,
    totalPendientes: contar(TicketConformidadResultado.PENDIENTE),
    totalFirmasCliente: conformidades.filter(
      (item) => item.resumen.tieneFirmaCliente,
    ).length,
    totalFirmasTecnico: conformidades.filter(
      (item) => item.resumen.tieneFirmaTecnico,
    ).length,
    requirioRetrabajoAlgunaVez: totalRetrabajos > 0,
    resultadoActual: ultima?.resultado ?? null,
    primeraSolicitudEn: primera?.creadoEn ?? null,
    ultimaSolicitudEn: ultima?.creadoEn ?? null,
    ultimaRespuestaEn:
      respuestas.length > 0
        ? new Date(Math.max(...respuestas.map((fecha) => fecha.getTime())))
        : null,
    tiempoPromedioRespuestaMinutos:
      tiempos.length > 0
        ? Math.round(
            tiempos.reduce((total, valor) => total + valor, 0) / tiempos.length,
          )
        : null,
  };
}
