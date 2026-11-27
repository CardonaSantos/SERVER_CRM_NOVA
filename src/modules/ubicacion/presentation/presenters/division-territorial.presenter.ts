import {
  DepartamentoReadModel,
  MunicipioReadModel,
} from '../../domain/read-models/division-territorial.read-model';
import {
  DepartamentoResponseDto,
  MunicipioResponseDto,
} from '../dto/division-territorial-response.dto';

export class DivisionTerritorialPresenter {
  static departamento(m: DepartamentoReadModel): DepartamentoResponseDto {
    return { id: m.id, nombre: m.nombre };
  }

  static municipio(m: MunicipioReadModel): MunicipioResponseDto {
    return { id: m.id, nombre: m.nombre, departamentoId: m.departamentoId };
  }
}
