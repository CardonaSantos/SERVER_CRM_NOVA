import {
  DatosDocumentoContrato,
  DocumentoContratoReadModel,
} from '../read-models/documento-contrato.read-model';

const ZONA_HORARIA = 'America/Guatemala';

export function armarDocumentoContrato(
  datos: DatosDocumentoContrato,
  plantilla: { id: number; nombre: string; body: string },
  ahora: Date,
): DocumentoContratoReadModel {
  const { empresa, instalacion, cliente, servicio, diaPagoZona } = datos;

  const nombreCompleto = [cliente.nombre, cliente.apellidos]
    .filter(Boolean)
    .join(' ')
    .trim();
  const direccionServicio =
    instalacion.direccionInstalacion ?? cliente.direccion ?? null;

  // Manda el día de pago de la zona; sin zona, el día en que se activó.
  const diaPagoMensual =
    diaPagoZona ?? diaDelMes(instalacion.fechaActivacionServicio ?? ahora);

  const costoTotal =
    instalacion.costoInstalacion +
    instalacion.costoMateriales +
    instalacion.costoManoObra +
    instalacion.costoOtros;

  const variables: Record<string, string | number> = {
    instalacion_id: instalacion.id,
    nombre_cliente: nombreCompleto,
    dpi_cliente: cliente.dpi ?? '',
    telefono_cliente: cliente.telefono ?? '',
    direccion_cliente: cliente.direccion ?? '',
    direccion_servicio: direccionServicio ?? '',
    referencia_ubicacion: instalacion.referenciaUbicacion ?? '',
    plan_nombre: servicio?.nombre ?? '',
    plan_velocidad: servicio?.velocidad ?? '',
    plan_precio: servicio ? servicio.precio : '',
    plan: servicio
      ? `${servicio.nombre}, precio: ${dinero(servicio.precio)}`
      : '',
    fecha_instalacion_programada: fecha(instalacion.fechaProgramada),
    fecha_activacion: fecha(instalacion.fechaActivacionServicio),
    costo_instalacion: dinero(instalacion.costoInstalacion),
    costo_materiales: dinero(instalacion.costoMateriales),
    costo_mano_obra: dinero(instalacion.costoManoObra),
    costo_otros: dinero(instalacion.costoOtros),
    costo_total: dinero(costoTotal),
    dia_pago_mensual: diaPagoMensual,
    observaciones: instalacion.observaciones ?? '',
    referencia_nombre: cliente.contactoReferenciaNombre ?? '',
    referencia_telefono: cliente.contactoReferenciaTelefono ?? '',
    fecha_actual: fecha(ahora),
  };

  return {
    empresa,
    instalacion,
    cliente: { ...cliente, nombreCompleto, direccionServicio },
    servicio,
    facturacion: { diaPagoMensual },
    plantilla: { id: plantilla.id, nombre: plantilla.nombre },
    documento: {
      numero: instalacion.id,
      fechaEmision: ahora,
      contenido: rellenar(plantilla.body, variables),
    },
  };
}

/** Sustituye `[variable]`; lo que no se conoce queda como está escrito. */
function rellenar(
  texto: string,
  variables: Record<string, string | number>,
): string {
  return texto.replace(/\[([^\]]+)\]/g, (original, clave: string) => {
    const nombre = clave.trim();
    return Object.prototype.hasOwnProperty.call(variables, nombre)
      ? String(variables[nombre])
      : original;
  });
}

function fecha(valor: Date | null): string {
  if (!valor) return '';

  return new Intl.DateTimeFormat('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: ZONA_HORARIA,
  }).format(valor);
}

function diaDelMes(valor: Date): number {
  return Number(
    new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      timeZone: ZONA_HORARIA,
    }).format(valor),
  );
}

function dinero(valor: number): string {
  return `Q${valor.toFixed(2)}`;
}
