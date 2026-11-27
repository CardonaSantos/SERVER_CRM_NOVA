import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CrearTipoServicioUseCase } from '../../application/use-cases/crear-tipo-servicio.use-case';
import { ListarTiposServicioUseCase } from '../../application/use-cases/listar-tipos-servicio.use-case';
import { CrearTipoServicioDto } from '../dto/crear-tipo-servicio.dto';
import { TipoServicioPresenter } from '../presenters/tipo-servicio.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('tipo-servicio')
@Controller('tipo-servicio')
export class TipoServicioController {
  constructor(
    private readonly crearTipo: CrearTipoServicioUseCase,
    private readonly listarTipos: ListarTiposServicioUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearTipoServicioDto) {
    return TipoServicioPresenter.item(
      await this.crearTipo.execute({
        nombre: dto.nombre,
        descripcion: dto.descripcion,
      }),
    );
  }

  @Get()
  async listar() {
    const tipos = await this.listarTipos.execute();

    return tipos.map((tipo) => TipoServicioPresenter.item(tipo));
  }
}
