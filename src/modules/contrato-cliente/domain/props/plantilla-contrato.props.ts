export type PlantillaContratoProps = {
  id: number | null;
  nombre: string;
  /** Texto del contrato con variables `[nombre_de_variable]`. */
  body: string;
  empresaId: number;
  creadoEn: Date;
  actualizadoEn: Date;
};

export type CrearPlantillaContratoProps = {
  nombre: string;
  body: string;
  empresaId: number;
};
