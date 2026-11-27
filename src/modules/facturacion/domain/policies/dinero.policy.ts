/** Montos en quetzales con dos decimales (la BD los guarda como `Float`). */
export const redondear = (monto: number): number =>
  Math.round(monto * 100) / 100;

export const sumar = (montos: number[]): number =>
  redondear(montos.reduce((total, monto) => total + monto, 0));

export const esMonto = (valor: number): boolean =>
  Number.isFinite(valor) &&
  valor >= 0 &&
  Math.abs(valor - redondear(valor)) < 1e-9;
