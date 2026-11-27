import { EstadoCampania } from '../enums/campania.enum';

export type CampaniaProps = {
  id: number | null;
  plantilla: string;
  idioma: string;
  imagenUrl: string | null;
  estado: EstadoCampania;
  creadoPorId: number | null;
  creadoEn: Date;
  actividadEn: Date;
  finalizadaEn: Date | null;
};

export type CrearCampaniaProps = Pick<
  CampaniaProps,
  'plantilla' | 'idioma' | 'imagenUrl' | 'creadoPorId'
>;
