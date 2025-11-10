// src/modules/reports/application/use-cases/clientes-internet/clientes-internet.row-mapper.ts
export const header = [
  { key: 'id', title: 'ID', width: 20 },
  { key: 'nombre', title: 'Nombre', width: 30 },
  { key: 'telefono', title: 'Telefono', width: 30 },
  {
    key: 'fechaAlta',
    title: 'F. Instalación',
    width: 15,
    numFmt: 'yyyy-mm-dd',
  },
  { key: 'plan', title: 'Plan', width: 18 },
  { key: 'estado', title: 'Estado', width: 15 },
  { key: 'saldo', title: 'Saldo', width: 15, numFmt: '#,##0.00' },
];

export type ClientesInternetRow = {
  id: string; // <— STRING (normalizamos en el repo)
  nombre: string;
  telefono?: string | null;
  fechaAlta: Date;
  plan: string;
  estado: string; // <— STRING (del enum)
  saldo: number;
};

export const mapRow = (r: ClientesInternetRow) => ({
  id: r.id,
  nombre: r.nombre,
  telefono: r.telefono ?? '',
  fechaAlta: r.fechaAlta,
  plan: r.plan,
  estado: r.estado,
  saldo: r.saldo,
});
