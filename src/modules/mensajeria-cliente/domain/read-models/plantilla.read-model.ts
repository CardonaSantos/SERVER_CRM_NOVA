/** Forma de un componente tal como la define WhatsApp. */
export type ComponentePlantilla = {
  type: string;
  format?: string;
  text?: string;
  example?: {
    body_text?: string[][];
    header_text?: string[];
    header_handle?: string[];
  };
  buttons?: Array<{
    type: string;
    text: string;
    url?: string;
    phone_number?: string;
    example?: string | string[];
  }>;
};

export type PlantillaReadModel = {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  components: ComponentePlantilla[];
};

export type PlantillaFiltros = {
  name?: string;
  language?: string;
  category?: string;
  status?: string;
  limit?: number;
  after?: string;
};

export type PaginaPlantillas = {
  items: PlantillaReadModel[];
  /** Cursor de la página siguiente; null si no hay más. */
  siguiente: string | null;
};
