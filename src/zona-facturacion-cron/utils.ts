import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { EstadoCliente, StateFacturaInternet } from '@prisma/client';
// Extiende dayjs con los plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export function formatearNumeroWhatsApp(numero: string): string {
  // Limpiar caracteres no numéricos
  const limpio = numero.trim().replace(/\D/g, '');

  // Si ya tiene el código completo
  if (limpio.startsWith('502') && limpio.length === 11) {
    return `whatsapp:+${limpio}`;
  }

  // Si es número nacional (8 dígitos)
  if (limpio.length === 8) {
    return `whatsapp:+502${limpio}`;
  }

  // Si ya viene con prefijo internacional completo (ej: +502)
  if (numero.startsWith('+')) {
    return `whatsapp:${numero}`;
  }

  // Número inválido
  throw new Error(`Número no válido o mal formateado: "${numero}"`);
}

export const formatearFecha = (fecha: string) => {
  return dayjs(fecha).format('DD/MM/YYYY');
};

export function renderTemplate(
  template: string,
  data: Record<string, any>,
): string {
  return template.replace(/\[([^\]]+)\]/g, (_, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : `[${key}]`;
  });
}
export interface DatosFacturaGenerate {
  fechaPagoEsperada: string;
  montoPago: number;
  saldoPendiente: number;
  datalleFactura: string;
  estadoFacturaInternet: string;
  cliente: number;
  facturacionZona: number;
  nombreClienteFactura: string;
  datalleFacturaParaMensaje?: string;
  numerosTelefono?: string[];
}

export interface DatosFacturaGenerateIndividual {
  datalleFactura: string;
  fechaPagoEsperada: string | Date;
  montoPago: number;
  saldoPendiente: number;
  estadoFacturaInternet: 'PENDIENTE' | 'PARCIAL' | 'PAGADA' | string;
  cliente: number;
  facturacionZona: number;
  nombreClienteFactura: string;
  numerosTelefono?: string[];
}

export const PENDIENTES_ENUM: StateFacturaInternet[] = [
  'PENDIENTE',
  'PARCIAL',
  'VENCIDA',
];

export function getEstadoCliente(pend: number): EstadoCliente {
  switch (pend) {
    case 0:
      return 'ACTIVO';
    case 1:
      return 'PENDIENTE_ACTIVO';
    case 2:
      return 'ATRASADO';
    default:
      return 'MOROSO';
  }
}
