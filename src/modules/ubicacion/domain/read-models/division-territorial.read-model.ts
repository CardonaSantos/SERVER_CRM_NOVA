export type DepartamentoReadModel = {
  id: number;
  nombre: string;
};

export type MunicipioReadModel = {
  id: number;
  nombre: string;
  departamentoId: number;
};
