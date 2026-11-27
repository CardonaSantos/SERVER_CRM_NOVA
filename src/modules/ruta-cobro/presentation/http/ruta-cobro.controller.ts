import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { ActualizarRutaCobroUseCase } from '../../application/use-cases/actualizar-ruta-cobro.use-case';
import { CerrarRutaCobroUseCase } from '../../application/use-cases/cerrar-ruta-cobro.use-case';
import { CrearRutaCobroUseCase } from '../../application/use-cases/crear-ruta-cobro.use-case';
import { EliminarRutaCobroUseCase } from '../../application/use-cases/eliminar-ruta-cobro.use-case';
import { ExportarRutaCobroUseCase } from '../../application/use-cases/exportar-ruta-cobro.use-case';
import { ListarRutasAsignadasUseCase } from '../../application/use-cases/listar-rutas-asignadas.use-case';
import { ListarRutasCobroUseCase } from '../../application/use-cases/listar-rutas-cobro.use-case';
import { ObtenerRutaCobroUseCase } from '../../application/use-cases/obtener-ruta-cobro.use-case';
import { ActualizarRutaCobroDto } from '../dto/actualizar-ruta-cobro.dto';
import { CrearRutaCobroDto } from '../dto/crear-ruta-cobro.dto';
import { ListarRutasCobroQueryDto } from '../dto/listar-rutas-cobro-query.dto';
import { RutaCobroPresenter } from '../presenters/ruta-cobro.presenter';

const TIPO_XLSX =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('ruta-cobro')
@Controller('ruta-cobro')
export class RutaCobroController {
  constructor(
    private readonly crearRuta: CrearRutaCobroUseCase,
    private readonly actualizarRuta: ActualizarRutaCobroUseCase,
    private readonly cerrarRuta: CerrarRutaCobroUseCase,
    private readonly eliminarRuta: EliminarRutaCobroUseCase,
    private readonly listarRutas: ListarRutasCobroUseCase,
    private readonly listarAsignadas: ListarRutasAsignadasUseCase,
    private readonly obtenerRuta: ObtenerRutaCobroUseCase,
    private readonly exportarRuta: ExportarRutaCobroUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearRutaCobroDto, @Actor() actor: ActorHttp) {
    const ruta = await this.crearRuta.execute({
      usuarioId: actor.usuarioId,
      empresaId: actor.empresaId,
      nombre: dto.nombre,
      cobradorId: dto.cobradorId,
      observaciones: dto.observaciones,
      clienteIds: dto.clienteIds,
    });

    return RutaCobroPresenter.guardada(ruta);
  }

  @Get()
  async listar(@Query() query: ListarRutasCobroQueryDto) {
    const resultado = await this.listarRutas.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      estados: query.estados,
      cobradorId: query.cobradorId,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    });

    return RutaCobroPresenter.listado(resultado);
  }

  @Get('rutas-cobros-asignadas')
  async asignadas(@Actor() actor: ActorHttp) {
    return RutaCobroPresenter.asignadas(
      await this.listarAsignadas.execute({ usuarioId: actor.usuarioId }),
    );
  }

  @Get('get-one-ruta-cobro/:rutaId')
  async enCobro(@Param('rutaId', ParseIntPipe) rutaId: number) {
    return RutaCobroPresenter.enCobro(await this.obtenerRuta.execute(rutaId));
  }

  @Get(':rutaId')
  async detalle(@Param('rutaId', ParseIntPipe) rutaId: number) {
    return RutaCobroPresenter.detalle(await this.obtenerRuta.execute(rutaId));
  }

  @Get(':rutaId/excel')
  async excel(@Param('rutaId', ParseIntPipe) rutaId: number) {
    return new StreamableFile(await this.exportarRuta.execute(rutaId), {
      type: TIPO_XLSX,
      disposition: `attachment; filename="clientes_ruta_${rutaId}.xlsx"`,
    });
  }

  @Patch(':rutaId')
  async actualizar(
    @Param('rutaId', ParseIntPipe) rutaId: number,
    @Body() dto: ActualizarRutaCobroDto,
    @Actor() actor: ActorHttp,
  ) {
    const ruta = await this.actualizarRuta.execute({
      rutaId,
      usuarioId: actor.usuarioId,
      cambios: {
        nombre: dto.nombre,
        cobradorId: dto.cobradorId,
        observaciones: dto.observaciones,
        estado: dto.estado,
        clienteIds: dto.clienteIds,
      },
    });

    return RutaCobroPresenter.guardada(ruta);
  }

  @Patch(':rutaId/cerrar')
  async cerrar(
    @Param('rutaId', ParseIntPipe) rutaId: number,
    @Actor() actor: ActorHttp,
  ) {
    return RutaCobroPresenter.guardada(
      await this.cerrarRuta.execute({ rutaId, usuarioId: actor.usuarioId }),
    );
  }

  @Delete(':rutaId')
  async eliminar(
    @Param('rutaId', ParseIntPipe) rutaId: number,
    @Actor() actor: ActorHttp,
  ) {
    return RutaCobroPresenter.eliminada(
      await this.eliminarRuta.execute({ rutaId, usuarioId: actor.usuarioId }),
    );
  }
}
