import { IsInt, IsPositive } from 'class-validator';

/** Body de `POST /media/delete`. */
export class EliminarMediaDto {
  /** Id de la fila en `Media`. */
  @IsInt()
  @IsPositive()
  id: number;
}
