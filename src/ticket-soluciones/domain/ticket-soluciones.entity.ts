import { verifyProps } from 'src/Utils/verifyProps';
//LA ENTIDAD, DEBE SER USADA EN OPERACIONES
export interface SolucionTicketProps {
  id?: number;
  solucion: string;
  descripcion: string;
  isEliminado: boolean;
}

export class SolucionTicket {
  readonly id?: number;
  readonly solucion: string;
  readonly descripcion: string;
  readonly isEliminado: boolean;

  constructor(props: SolucionTicketProps) {
    this.id = props.id;
    this.solucion = props.solucion;
    this.descripcion = props.descripcion;
    this.isEliminado = props.isEliminado;
  }

  static create(solucion: string, descripcion: string) {
    const dto: SolucionTicketProps = {
      solucion,
      descripcion,
      isEliminado: false,
    };

    verifyProps<SolucionTicketProps>(dto, ['descripcion', 'solucion']);

    return new SolucionTicket(dto);
  }
}
