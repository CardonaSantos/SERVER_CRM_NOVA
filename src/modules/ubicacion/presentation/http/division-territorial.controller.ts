import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ListarDepartamentosUseCase } from '../../application/use-cases/listar-departamentos.use-case';
import { ListarMunicipiosUseCase } from '../../application/use-cases/listar-municipios.use-case';
import { ListarMunicipiosQueryDto } from '../dto/listar-municipios-query.dto';
import { DivisionTerritorialPresenter } from '../presenters/division-territorial.presenter';

/** Solo lectura: el catálogo no se modifica desde la API. */
@ApiTags('ubicacion')
@Controller('ubicacion')
export class DivisionTerritorialController {
  constructor(
    private readonly listarDepartamentos: ListarDepartamentosUseCase,
    private readonly listarMunicipios: ListarMunicipiosUseCase,
  ) {}

  @Get('departamentos')
  async departamentos() {
    const departamentos = await this.listarDepartamentos.execute();

    return departamentos.map((d) =>
      DivisionTerritorialPresenter.departamento(d),
    );
  }

  @Get('municipios')
  async municipios(@Query() query: ListarMunicipiosQueryDto) {
    const municipios = await this.listarMunicipios.execute(
      query.departamentoId,
    );

    return municipios.map((m) => DivisionTerritorialPresenter.municipio(m));
  }
}
