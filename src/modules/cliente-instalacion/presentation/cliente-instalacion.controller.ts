import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CrearClienteInstalacionDto } from '../application/dto/crear-cliente-instalacion.dto';
import { ClienteInstalacionPresenter } from './cliente-instalacion.presenter';
import { ClienteInstalacionApplicationService } from '../application/services/cliente-instalacion.aplication-service.service';
import { FiltrarClienteInstalacionesDto } from '../application/dto/filtrar-cliente-instalaciones.dto';
import { ActualizarClienteInstalacionDto } from '../application/dto/actualizar-cliente-instalacion.dto';
import { ReprogramarClienteInstalacionDto } from '../application/dto/reprogramar-cliente-instalacion.dto';
import { IniciarInstalacionClienteDto } from '../application/dto/iniciar-instalacion.dto';
import { CompletarClienteInstalacionDto } from '../application/dto/completar-cliente-instalacion.dto';
import { CancelarClienteInstalacionDto } from '../application/dto/cancelar-cliente-instalacion.dto';

@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cliente-instalaciones')
export class ClienteInstalacionController {
  constructor(
    private readonly clienteInstalacionService: ClienteInstalacionApplicationService,
  ) {}

  @Post()
  async crear(@Body() dto: CrearClienteInstalacionDto, @Req() req: any) {
    const creadoPorId = req.user?.id ?? dto.asesorId ?? 1;

    const instalacion = await this.clienteInstalacionService.crear(
      dto,
      creadoPorId,
    );

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  @Get()
  async listar(@Query() query: FiltrarClienteInstalacionesDto) {
    const result = await this.clienteInstalacionService.listar(query);

    return ClienteInstalacionPresenter.paginatedToHttp(result);
  }

  @Get(':id')
  async obtener(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
  ) {
    const instalacion = await this.clienteInstalacionService.obtener(
      id,
      empresaId,
    );

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  @Patch(':id')
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @Body() dto: ActualizarClienteInstalacionDto,
  ) {
    const instalacion = await this.clienteInstalacionService.actualizar(
      id,
      empresaId,
      dto,
    );

    return ClienteInstalacionPresenter.toHttp(instalacion);
  }

  // BEHAVIORS

  @Patch('reprogramar/:id')
  async reprogramar(
    @Body() dto: ReprogramarClienteInstalacionDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return ClienteInstalacionPresenter.toHttp(
      await this.clienteInstalacionService.reprogramar(dto, id),
    );
  }

  @Post('iniciar/:id')
  async iniciar(
    @Body() dto: IniciarInstalacionClienteDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return ClienteInstalacionPresenter.toHttp(
      await this.clienteInstalacionService.iniciar(dto, id),
    );
  }

  @Post('completar/:id')
  async completar(
    @Body() dto: CompletarClienteInstalacionDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return ClienteInstalacionPresenter.toHttp(
      await this.clienteInstalacionService.completar(dto, id),
    );
  }

  @Post('cancelar/:id')
  async cancelar(
    @Body() dto: CancelarClienteInstalacionDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return ClienteInstalacionPresenter.toHttp(
      await this.clienteInstalacionService.cancelar(dto, id),
    );
  }
}
