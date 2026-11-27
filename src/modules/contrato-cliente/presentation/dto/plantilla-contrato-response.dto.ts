export class PlantillaContratoItemResponseDto {
  /** Id de la plantilla */
  id: number;
  /** Nombre */
  nombre: string;
  /** Alta */
  creadoEn: string;
  /** Último cambio */
  actualizadaEn: string;
}

export class PlantillaContratoResponseDto extends PlantillaContratoItemResponseDto {
  /** Texto del contrato */
  body: string;
}
