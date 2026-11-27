import { AgrupacionUbicacion } from '../enums/agrupacion-ubicacion.enum';
import {
  ClienteConPlan,
  ClientesPorPlanReadModel,
  ClientesPorUbicacionReadModel,
  ClienteUbicado,
  FilaUbicacion,
} from '../read-models/cartera.read-model';
import { FacturaSinPagar } from '../read-models/finanzas.read-model';
import { esVencida, saldoDe } from './deuda.policy';
import { redondear } from './estadisticas.policy';

const SIN_DATO: Record<AgrupacionUbicacion, string> = {
  [AgrupacionUbicacion.ZONA]: 'Sin zona',
  [AgrupacionUbicacion.SECTOR]: 'Sin sector',
  [AgrupacionUbicacion.MUNICIPIO]: 'Sin municipio',
};

/** Mismas condiciones con las que se genera la factura mensual. */
export function clientesPorPlan(
  clientes: ClienteConPlan[],
): ClientesPorPlanReadModel {
  const planes = new Map<number, ClientesPorPlanReadModel['planes'][number]>();
  const sinFacturar = {
    sinPlan: 0,
    sinZona: 0,
    conFechaDeDesinstalacion: 0,
  };

  for (const cliente of clientes) {
    const { plan } = cliente;
    const motivo = !cliente.activo
      ? null
      : cliente.tieneFechaDesinstalacion
        ? 'conFechaDeDesinstalacion'
        : !plan
          ? 'sinPlan'
          : !cliente.tieneZona
            ? 'sinZona'
            : null;

    if (motivo) sinFacturar[motivo] += 1;
    if (!plan) continue;

    const fila = planes.get(plan.id) ?? {
      planId: plan.id,
      nombre: plan.nombre,
      precio: plan.precio,
      clientesFacturables: 0,
      clientesSuspendidos: 0,
      ingresoMensualEsperado: 0,
    };

    if (!cliente.activo) fila.clientesSuspendidos += 1;
    else if (!motivo) fila.clientesFacturables += 1;

    fila.ingresoMensualEsperado = redondear(
      fila.clientesFacturables * plan.precio,
    );
    planes.set(plan.id, fila);
  }

  const filas = etiquetasUnicas(
    [...planes.values()].sort(
      (a, b) =>
        b.ingresoMensualEsperado - a.ingresoMensualEsperado ||
        a.planId - b.planId,
    ),
    (fila) => fila.planId,
  );
  const total = (valores: number[]) =>
    redondear(valores.reduce((a, b) => a + b, 0));

  return {
    planes: filas,
    activosSinFacturar: sinFacturar,
    totales: {
      clientesFacturables: total(filas.map((f) => f.clientesFacturables)),
      clientesSuspendidos: total(filas.map((f) => f.clientesSuspendidos)),
      ingresoMensualEsperado: total(filas.map((f) => f.ingresoMensualEsperado)),
    },
  };
}

export function clientesPorUbicacion(
  agrupar: AgrupacionUbicacion,
  hoy: string,
  clientes: ClienteUbicado[],
  facturas: FacturaSinPagar[],
): ClientesPorUbicacionReadModel {
  const deudas = new Map<number, FacturaSinPagar[]>();
  for (const factura of facturas) {
    deudas.set(factura.clienteId, [
      ...(deudas.get(factura.clienteId) ?? []),
      factura,
    ]);
  }

  const grupos = new Map<number | null, FilaUbicacion>();
  for (const cliente of clientes) {
    const id = cliente.grupo?.id ?? null;
    const fila = grupos.get(id) ?? {
      id,
      nombre: cliente.grupo ? cliente.grupo.nombre : SIN_DATO[agrupar],
      clientes: 0,
      clientesConDeudaVencida: 0,
      deuda: 0,
      deudaVencida: 0,
    };
    const suyas = deudas.get(cliente.id) ?? [];
    const vencidas = suyas.filter((f) => esVencida(f.vence, hoy));
    const sumar = (lista: FacturaSinPagar[]) =>
      lista.reduce((total, f) => total + saldoDe(f), 0);

    fila.clientes += 1;
    if (sumar(vencidas) > 0) fila.clientesConDeudaVencida += 1;
    fila.deuda = redondear(fila.deuda + sumar(suyas));
    fila.deudaVencida = redondear(fila.deudaVencida + sumar(vencidas));
    grupos.set(id, fila);
  }

  const filas = etiquetasUnicas(
    [...grupos.values()].sort(
      (a, b) => b.clientes - a.clientes || (a.id ?? 0) - (b.id ?? 0),
    ),
    (fila) => fila.id,
  );
  const total = (campo: keyof ClientesPorUbicacionReadModel['totales']) =>
    redondear(filas.reduce((suma, f) => suma + f[campo], 0));

  return {
    agrupar,
    corte: hoy,
    grupos: filas,
    totales: {
      clientes: total('clientes'),
      clientesConDeudaVencida: total('clientesConDeudaVencida'),
      deuda: total('deuda'),
      deudaVencida: total('deudaVencida'),
    },
  };
}

/**
 * Un eje de categorías junta los nombres iguales: a los repetidos o vacíos se
 * les distingue con su número.
 */
function etiquetasUnicas<T extends { nombre: string }>(
  filas: T[],
  id: (fila: T) => number | null,
): T[] {
  const veces = new Map<string, number>();
  for (const fila of filas) {
    const nombre = fila.nombre.trim();
    veces.set(nombre, (veces.get(nombre) ?? 0) + 1);
  }

  return filas.map((fila) => {
    const nombre = fila.nombre.trim();
    if (!nombre) return { ...fila, nombre: `Sin nombre (${id(fila)})` };

    return {
      ...fila,
      nombre: veces.get(nombre)! > 1 ? `${nombre} (${id(fila)})` : nombre,
    };
  });
}
