/** Datos que salen en facturas, boletas, contratos y comprobantes. */
export type DatosEmpresa = {
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  pbx: string | null;
  correo: string | null;
  sitioWeb: string | null;
  nit: string | null;
  logo1: string | null;
  logo2: string | null;
  logo3: string | null;
};

export type EmpresaProps = DatosEmpresa & {
  id: number;
  actualizadoEn: Date;
};

/** Solo cambia lo que llega; `null` o texto vacío quitan el dato. */
export type CambiosEmpresa = {
  [Campo in keyof DatosEmpresa]?: string | null;
};
