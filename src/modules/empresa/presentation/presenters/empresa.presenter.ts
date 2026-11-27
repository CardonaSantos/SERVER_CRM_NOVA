import { EmpresaProps } from '../../domain/props/empresa.props';
import {
  EmpresaResponseDto,
  EmpresaResumenResponseDto,
} from '../dto/empresa-response.dto';

export class EmpresaPresenter {
  static resumen(e: EmpresaProps): EmpresaResumenResponseDto {
    return { id: e.id, nombre: e.nombre, logo1: e.logo1 };
  }

  static detalle(e: EmpresaProps): EmpresaResponseDto {
    return {
      id: e.id,
      nombre: e.nombre,
      direccion: e.direccion,
      telefono: e.telefono,
      pbx: e.pbx,
      correo: e.correo,
      sitioWeb: e.sitioWeb,
      nit: e.nit,
      logo1: e.logo1,
      logo2: e.logo2,
      logo3: e.logo3,
      actualizadaEn: e.actualizadoEn.toISOString(),
    };
  }
}
