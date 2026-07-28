import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';

import { CreateMikroTikDto } from '../dto/create-mikro-tik.dto';

import { UpdateMikroTikDto } from '../dto/update-mikro-tik.dto';

import { CrearMikrotikRouterUseCase } from '../application/use-cases/crear-mikrotik-router.use-case';

import { ActualizarMikrotikRouterUseCase } from '../application/use-cases/actualizar-mikrotik-router.use-case';

import { ObtenerMikrotikRouterUseCase } from '../application/use-cases/obtener-mikrotik-router.use-case';

import { ListarMikrotikRoutersUseCase } from '../application/use-cases/listar-mikrotik-routers.use-case';

import { EliminarMikrotikRouterUseCase } from '../application/use-cases/eliminar-mikrotik-router.use-case';

@Controller('mikro-tik')
export class MikroTikController {
  constructor(
    private readonly crearMikrotikRouter: CrearMikrotikRouterUseCase,

    private readonly actualizarMikrotikRouter: ActualizarMikrotikRouterUseCase,

    private readonly obtenerMikrotikRouter: ObtenerMikrotikRouterUseCase,

    private readonly listarMikrotikRouters: ListarMikrotikRoutersUseCase,

    private readonly eliminarMikrotikRouter: EliminarMikrotikRouterUseCase,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateMikroTikDto,
  ) {
    return this.crearMikrotikRouter.execute(dto);
  }

  @Get()
  getAll() {
    return this.listarMikrotikRouters.execute();
  }

  @Get(':id')
  getById(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.obtenerMikrotikRouter.execute(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe)
    id: number,

    @Body()
    dto: UpdateMikroTikDto,
  ) {
    return this.actualizarMikrotikRouter.execute({
      id,

      ...dto,
    });
  }

  @Delete(':id')
  deleteById(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.eliminarMikrotikRouter.execute(id);
  }
}
