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
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { ActualizarZonaFacturacionUseCase } from '../../application/use-cases/actualizar-zona-facturacion.use-case';
import { CrearZonaFacturacionUseCase } from '../../application/use-cases/crear-zona-facturacion.use-case';
import { EliminarZonaFacturacionUseCase } from '../../application/use-cases/eliminar-zona-facturacion.use-case';
import { ListarOpcionesZonaFacturacionUseCase } from '../../application/use-cases/listar-opciones-zona-facturacion.use-case';
import { ListarZonasFacturacionUseCase } from '../../application/use-cases/listar-zonas-facturacion.use-case';
import { ActualizarZonaFacturacionDto } from '../dto/actualizar-zona-facturacion.dto';
import { CrearZonaFacturacionDto } from '../dto/crear-zona-facturacion.dto';
import { ListarZonasFacturacionQueryDto } from '../dto/listar-zonas-facturacion-query.dto';
import { ZonaFacturacionPresenter } from '../presenters/zona-facturacion.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('facturacion-zona')
@Controller('facturacion-zona')
export class ZonaFacturacionController {
  constructor(
    private readonly crearZona: CrearZonaFacturacionUseCase,
    private readonly actualizarZona: ActualizarZonaFacturacionUseCase,
    private readonly eliminarZona: EliminarZonaFacturacionUseCase,
    private readonly listarZonas: ListarZonasFacturacionUseCase,
    private readonly listarOpciones: ListarOpcionesZonaFacturacionUseCase,
  ) {}

  @Post()
  async crear(@Body() dto: CrearZonaFacturacionDto, @Actor() actor: ActorHttp) {
    const zona = await this.crearZona.execute({
      empresaId: actor.empresaId,
      nombre: dto.nombre,
      diaGeneracionFactura: dto.diaGeneracionFactura,
      diaPago: dto.diaPago,
      diaRecordatorio: dto.diaRecordatorio,
      diaSegundoRecordatorio: dto.diaSegundoRecordatorio,
      diaCorte: dto.diaCorte,
      suspenderTrasFacturas: dto.suspenderTrasFacturas,
      enviarRecordatorio: dto.enviarRecordatorio,
      enviarRecordatorioGeneracion: dto.enviarRecordatorioGeneracion,
      enviarAvisoPago: dto.enviarAvisoPago,
      enviarRecordatorio1: dto.enviarRecordatorio1,
      enviarRecordatorio2: dto.enviarRecordatorio2,
    });

    return ZonaFacturacionPresenter.detalle(zona);
  }

  @Get()
  async listar(@Query() query: ListarZonasFacturacionQueryDto) {
    const resultado = await this.listarZonas.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sortBy: query.sortBy,
      sortDir: query.sortDir,
    });

    return ZonaFacturacionPresenter.listado(resultado);
  }

  @Get('opciones-filtro')
  async opciones() {
    const zonas = await this.listarOpciones.execute();

    return zonas.map((zona) => ZonaFacturacionPresenter.opcion(zona));
  }

  @Patch(':zonaId')
  async actualizar(
    @Param('zonaId', ParseIntPipe) zonaId: number,
    @Body() dto: ActualizarZonaFacturacionDto,
  ) {
    const zona = await this.actualizarZona.execute({
      zonaId,
      cambios: {
        nombre: dto.nombre,
        diaGeneracionFactura: dto.diaGeneracionFactura,
        diaPago: dto.diaPago,
        diaRecordatorio: dto.diaRecordatorio,
        diaSegundoRecordatorio: dto.diaSegundoRecordatorio,
        diaCorte: dto.diaCorte,
        suspenderTrasFacturas: dto.suspenderTrasFacturas,
        enviarRecordatorio: dto.enviarRecordatorio,
        enviarRecordatorioGeneracion: dto.enviarRecordatorioGeneracion,
        enviarAvisoPago: dto.enviarAvisoPago,
        enviarRecordatorio1: dto.enviarRecordatorio1,
        enviarRecordatorio2: dto.enviarRecordatorio2,
      },
    });

    return ZonaFacturacionPresenter.detalle(zona);
  }

  @Delete(':zonaId')
  async eliminar(
    @Param('zonaId', ParseIntPipe) zonaId: number,
    @Actor() actor: ActorHttp,
  ) {
    const resultado = await this.eliminarZona.execute({
      zonaId,
      usuarioId: actor.usuarioId,
    });

    return ZonaFacturacionPresenter.eliminada(resultado);
  }
}
