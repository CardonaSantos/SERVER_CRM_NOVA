import { EmpresaDatosInvalidosError } from '../errors/empresa.errors';
import { CambiosEmpresa, EmpresaProps } from '../props/empresa.props';

const OPCIONALES = [
  'direccion',
  'telefono',
  'pbx',
  'correo',
  'sitioWeb',
  'nit',
  'logo1',
  'logo2',
  'logo3',
] as const;

/**
 * La empresa de la instalación: una por base de datos. No se crea ni se borra
 * desde la API (muchas tablas apuntan a ella); solo se editan sus datos.
 */
export class EmpresaEntity {
  private constructor(private props: EmpresaProps) {}

  static hydrate(props: EmpresaProps): EmpresaEntity {
    return new EmpresaEntity({ ...props });
  }

  actualizar(cambios: CambiosEmpresa, ahora: Date): void {
    const nuevas: EmpresaProps = { ...this.props, actualizadoEn: ahora };

    if (cambios.nombre !== undefined) {
      const nombre = cambios.nombre?.trim();
      if (!nombre) {
        throw new EmpresaDatosInvalidosError(
          'El nombre de la empresa es obligatorio.',
        );
      }
      nuevas.nombre = nombre;
    }

    for (const campo of OPCIONALES) {
      const valor = cambios[campo];
      if (valor !== undefined) nuevas[campo] = valor?.trim() || null;
    }

    this.props = nuevas;
  }

  get id(): number {
    return this.props.id;
  }

  toPrimitives(): EmpresaProps {
    return { ...this.props };
  }
}
