import { Logger } from '@nestjs/common';
import {
  formattFechaWithMinutes,
  formattShortFecha,
} from 'src/Utils/formattFecha.utils';

function siNo(value: boolean): string {
  return value ? 'Sí' : 'No';
}

export function buildContratoVariables(params: { empresa: any; credito: any }) {
  const logger = new Logger('BuildContrato');
  const { empresa, credito } = params;
  const cliente = credito.cliente;

  const cuotas = credito.cuotas ?? [];
  const cuotasPagadas = cuotas.filter((c) => c.estado === 'PAGADA').length;
  const cuotasPendientes = cuotas.filter(
    (c) => c.estado === 'PENDIENTE',
  ).length;
  const cuotasVencidas = cuotas.filter((c) => c.estado === 'VENCIDA').length;

  const moras = cuotas.flatMap((c) => c.moras ?? []);
  const totalDiasMora = moras.reduce((acc, m) => acc + m.diasMora, 0);
  const totalInteresMora = moras.reduce((acc, m) => acc + Number(m.interes), 0);

  const pagos = credito.pagos ?? [];
  const totalPagado = pagos.reduce((acc, p) => acc + Number(p.montoTotal), 0);
  const ultimoPago = pagos.at(-1);

  logger.log(`credito:\n${JSON.stringify(credito, null, 2)}`);

  logger.log(`cuotas:\n${JSON.stringify(cuotas, null, 2)}`);

  return {
    // CLIENTE
    'cliente.id': cliente.id,
    'cliente.nombre': cliente.nombre,
    'cliente.apellidos': cliente.apellidos,
    'cliente.nombreCompleto': `${cliente.nombre} ${cliente.apellidos}`,
    'cliente.dpi': cliente.dpi,
    'cliente.nit': cliente.nit,
    'cliente.telefono': cliente.telefono,
    // 'cliente.email': cliente.email,
    'cliente.direccion': cliente.direccion,
    // 'cliente.municipio': cliente.municipio,
    // 'cliente.departamento': cliente.departamento,
    'cliente.municipio': cliente.municipio?.nombre || '',
    'cliente.departamento': cliente.departamento?.nombre || '',

    // CREDITO
    'credito.id': credito.id,
    'credito.montoCapital': credito.montoCapital,
    'credito.montoTotal': credito.montoTotal,
    'credito.montoCuota': credito.montoCuota,
    'credito.plazoCuotas': credito.plazoCuotas,
    'credito.frecuencia': credito.frecuencia,
    'credito.estado': credito.estado,
    'credito.interesPorcentaje': credito.interesPorcentaje,
    'credito.interesMoraPorcentaje': credito.interesMoraPorcentaje,
    'credito.intervaloDias': credito.intervaloDias,
    'credito.interesTipo': credito.interesTipo,
    'credito.origen': credito.origenCredito,
    'credito.observaciones': credito.observaciones ?? '',
    'credito.fechaInicio': formattShortFecha(credito.fechaInicio),
    'credito.creadoEn': formattFechaWithMinutes(credito.creadoEn),

    // CUOTAS
    'cuotas.total': cuotas.length,
    'cuotas.pagadas': cuotasPagadas,
    'cuotas.pendientes': cuotasPendientes,
    'cuotas.vencidas': cuotasVencidas,

    // MORA
    'mora.tieneMora': siNo(moras.length > 0),
    'mora.totalDias': totalDiasMora,
    'mora.montoTotal': totalInteresMora,
    'mora.interesTotal': totalInteresMora,

    // PAGOS
    'pagos.totalPagado': totalPagado,
    'pagos.numeroPagos': pagos.length,
    'pagos.fechaUltimoPago':
      formattFechaWithMinutes(ultimoPago?.fechaPago) ?? '',

    // EMPRESA
    'empresa.nombre': empresa.nombre,
    'empresa.razonSocial': empresa.razonSocial,
    'empresa.nit': empresa.nit,
    'empresa.direccion': empresa.direccion,
    'empresa.telefono': empresa.telefono,
    // 'empresa.email': empresa.email,

    // FLAGS
    'flags.tieneEnganche': siNo(!!credito.engancheMonto),
    'flags.tieneMora': siNo(moras.length > 0),
    'flags.creditoActivo': siNo(credito.estado === 'ACTIVO'),
  };
}

export function renderPlantilla(
  template: string,
  variables: Record<string, any>,
): string {
  // Esta regex busca todo lo que esté entre {{ }} incluso si tiene saltos de línea o etiquetas
  return template.replace(/{{\s*([\s\S]*?)\s*}}/g, (match, contentInside) => {
    // 1. Limpiamos el contenido interno de cualquier etiqueta HTML (ej: <strong>credito.id</strong> -> credito.id)
    const cleanKey = contentInside.replace(/<[^>]*>?/gm, '').trim();

    // 2. Buscamos en nuestro objeto de variables
    const value = variables[cleanKey];

    // 3. Si existe, devolvemos el valor. Si no, devolvemos el match original para no romper el HTML
    if (value !== undefined && value !== null) {
      return String(value);
    }

    return match;
  });
}
