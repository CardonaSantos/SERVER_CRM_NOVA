import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { CrearCampaniaUseCase } from '../../application/use-cases/crear-campania.use-case';
import { ListarCampaniasUseCase } from '../../application/use-cases/listar-campanias.use-case';
import { ListarEnviosCampaniaUseCase } from '../../application/use-cases/listar-envios-campania.use-case';
import { ObtenerCampaniaUseCase } from '../../application/use-cases/obtener-campania.use-case';
import { ReanudarCampaniaUseCase } from '../../application/use-cases/reanudar-campania.use-case';
import { EnviarCampaniaDto } from '../dto/enviar-campania.dto';
import { ListarEnviosCampaniaQueryDto } from '../dto/listar-envios-campania-query.dto';
import { CampaniaPresenter } from '../presenters/campania.presenter';

@ApiTags('whatsapp-campaigns')
@Controller('whatsapp-campaigns')
export class CampaniaWhatsappController {
  constructor(
    private readonly crearCampania: CrearCampaniaUseCase,
    private readonly listarCampanias: ListarCampaniasUseCase,
    private readonly obtenerCampania: ObtenerCampaniaUseCase,
    private readonly listarEnvios: ListarEnviosCampaniaUseCase,
    private readonly reanudarCampania: ReanudarCampaniaUseCase,
  ) {}

  /** Registra la campaña y responde; el envío sigue en segundo plano. */
  @Post('send-massive-message')
  @HttpCode(HttpStatus.ACCEPTED)
  async enviar(@Body() dto: EnviarCampaniaDto, @Actor() actor: ActorHttp) {
    return CampaniaPresenter.item(
      await this.crearCampania.execute({
        usuarioId: actor.usuarioId,
        plantilla: dto.plantilla,
        idioma: dto.idioma,
        clienteIds: dto.clienteIds,
        imagenUrl: dto.imagenUrl,
      }),
    );
  }

  /** Historial de campañas. */
  @Get()
  async listar(@Query() query: PaginacionQueryDto) {
    return CampaniaPresenter.listado(
      await this.listarCampanias.execute({
        page: query.page,
        limit: query.limit,
      }),
    );
  }

  /** Avance de una campaña. */
  @Get(':campaniaId')
  async obtener(@Param('campaniaId', ParseIntPipe) campaniaId: number) {
    return CampaniaPresenter.item(
      await this.obtenerCampania.execute({ campaniaId }),
    );
  }

  /** Resultado por destinatario. */
  @Get(':campaniaId/envios')
  async envios(
    @Param('campaniaId', ParseIntPipe) campaniaId: number,
    @Query() query: ListarEnviosCampaniaQueryDto,
  ) {
    return CampaniaPresenter.envios(
      await this.listarEnvios.execute({
        campaniaId,
        estado: query.estado,
        page: query.page,
        limit: query.limit,
      }),
    );
  }

  /** Envía lo pendiente de una campaña interrumpida. */
  @Post(':campaniaId/reanudar')
  @HttpCode(HttpStatus.ACCEPTED)
  async reanudar(
    @Param('campaniaId', ParseIntPipe) campaniaId: number,
    @Actor() actor: ActorHttp,
  ) {
    return CampaniaPresenter.item(
      await this.reanudarCampania.execute({
        usuarioId: actor.usuarioId,
        campaniaId,
      }),
    );
  }
}
