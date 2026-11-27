import { EstadoCampania } from '../enums/campania.enum';
import { CampaniaNoReanudableError } from '../errors/mensajeria-cliente.errors';
import { estadoVigente } from '../policies/campania.policy';
import { CampaniaProps, CrearCampaniaProps } from '../props/campania.props';

export class CampaniaEntity {
  private constructor(private props: CampaniaProps) {}

  static create(input: CrearCampaniaProps, ahora: Date): CampaniaEntity {
    return new CampaniaEntity({
      ...input,
      id: null,
      estado: EstadoCampania.EN_CURSO,
      creadoEn: ahora,
      actividadEn: ahora,
      finalizadaEn: null,
    });
  }

  static hydrate(props: CampaniaProps): CampaniaEntity {
    return new CampaniaEntity({ ...props });
  }

  /** Vuelve a enviar lo pendiente de una campaña que se cortó. */
  reanudar(ahora: Date): void {
    if (estadoVigente(this.props, ahora) !== EstadoCampania.INTERRUMPIDA) {
      throw new CampaniaNoReanudableError();
    }
    this.props.estado = EstadoCampania.EN_CURSO;
    this.props.actividadEn = ahora;
  }

  get id(): number | null {
    return this.props.id;
  }

  get plantilla(): string {
    return this.props.plantilla;
  }

  get idioma(): string {
    return this.props.idioma;
  }

  get imagenUrl(): string | null {
    return this.props.imagenUrl;
  }

  toPrimitives(): CampaniaProps {
    return { ...this.props };
  }
}
