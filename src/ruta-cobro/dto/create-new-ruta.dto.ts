import { IsArray, IsInt, IsString } from 'class-validator';

// create-new-ruta.dto.ts (ejemplo)
export class CreateNewRutaDto {
  empresaId: number;
  nombreRuta: string;
  observaciones?: string;
  cobradorId?: number; // puede ser opcional
  asignadoPor: number; // si lo sigues enviando desde el front

  clientesIds: number[]; // 👈 ahora esto es lo importante
}
