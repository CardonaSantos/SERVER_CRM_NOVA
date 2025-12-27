import { verifyProps } from 'src/Utils/verifyProps';
//LA ENTIDAD, DEBE SER USADA EN OPERACIONES
export interface SolucionTicketProps {
  id?: number;
  solucion: string;
  descripcion: string;
  isEliminado: boolean;
  ticketsCount?: number;
}

export class SolucionTicket {
  readonly id?: number;
  readonly solucion: string;
  readonly descripcion: string;
  readonly isEliminado: boolean;
  readonly ticketsCount?: number;

  constructor(props: SolucionTicketProps) {
    this.id = props.id;
    this.solucion = props.solucion;
    this.descripcion = props.descripcion;
    this.isEliminado = props.isEliminado;
    this.ticketsCount = props.ticketsCount ?? 0;
  }

  static create(solucion: string, descripcion: string) {
    const dto: SolucionTicketProps = {
      solucion,
      descripcion,
      isEliminado: false,
      //ticket nuevo no contendrá el ticketscount al crear
    };

    verifyProps<SolucionTicketProps>(dto, ['descripcion', 'solucion']);

    return new SolucionTicket(dto);
  }
}
