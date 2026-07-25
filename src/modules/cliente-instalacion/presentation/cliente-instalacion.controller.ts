import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
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
import { FileInterceptor } from '@nestjs/platform-express';
import { SubirEvidenciaInstalacionDto } from '../application/dto/subir-evidencia-instalacion.dto';
import { ReintentarPrealtaPppoeDto } from '../application/dto/reintentar-prealta-pppoe.dto';
import { ConsultarCredencialesPppoeDto } from '../application/dto/consultar-credenciales-pppoe.dto';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number;
    sub?: number;

    nombre?: string;

    empresaId?: number;
  };
};

@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('cliente-instalaciones')
export class ClienteInstalacionController {
  private readonly logger = new Logger();
  constructor(
    private readonly clienteInstalacionService: ClienteInstalacionApplicationService,
  ) {}

  @Post()
  async crear(@Body() dto: CrearClienteInstalacionDto) {
    const result = await this.clienteInstalacionService.crear(
      dto,
      dto.creadoPorId,
    );

    return ClienteInstalacionPresenter.crearToHttp(result);
  }

  @Post(':instalacionId/accesos/:accesoInternetId/prealta-pppoe/reintentar')
  async reintentarPrealtaPppoe(
    @Param('instalacionId', ParseIntPipe)
    instalacionId: number,

    @Param('accesoInternetId', ParseIntPipe)
    accesoInternetId: number,

    @Body()
    dto: ReintentarPrealtaPppoeDto,
  ) {
    return this.clienteInstalacionService.reintentarPrealtaPppoe({
      instalacionId,

      accesoInternetId,

      dto,

      operadorId: dto.operadorId,

      operadorNombre: null,

      ipOrigen: null,

      userAgent: null,
    });
  }

  @Post(':instalacionId/credenciales-pppoe/revelar')
  @HttpCode(HttpStatus.OK)
  async consultarCredencialesPppoe(
    @Param('instalacionId', ParseIntPipe)
    instalacionId: number,

    @Body()
    dto: ConsultarCredencialesPppoeDto,
  ) {
    const result =
      await this.clienteInstalacionService.consultarCredencialesPppoe({
        instalacionId,

        operadorId: dto.operadorId,

        operadorNombre: null,

        ipOrigen: null,

        userAgent: null,
      });

    return {
      instalacionId: result.instalacionId,

      credenciales: result.credenciales.map((credencial) => ({
        cuentaPppoeId: credencial.cuentaPppoeId,

        accesoInternetId: credencial.accesoInternetId,

        perfilHomologacionId: credencial.perfilHomologacionId,

        mikrotikRouterId: credencial.mikrotikRouterId,

        servicioInternetId: credencial.servicioInternetId,

        codigoPerfil: credencial.codigoPerfil,

        usuario: credencial.usuario,

        contrasena: credencial.contrasena,

        estadoCuenta: credencial.estadoCuenta,

        generadoEn: credencial.generadoEn.toISOString(),
      })),
    };
  }

  @Get()
  async listar(@Query() query: FiltrarClienteInstalacionesDto) {
    const result = await this.clienteInstalacionService.listar(query);
    this.logger.log(`result recibido:\n${JSON.stringify(result, null, 2)}`);
    return ClienteInstalacionPresenter.paginatedToHttp(result);
  }

  @Get(':id')
  async obtener(@Param('id', ParseIntPipe) id: number) {
    const detalle = await this.clienteInstalacionService.obtener(id);

    return ClienteInstalacionPresenter.detalleToHttp(detalle);
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

  @Post(':id/evidencias/upload')
  @UseInterceptors(FileInterceptor('file'))
  async subirEvidencia(
    @Param('id', ParseIntPipe) id: number,
    @Query('empresaId', ParseIntPipe) empresaId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: SubirEvidenciaInstalacionDto,
    @Req() req: any,
  ) {
    return this.clienteInstalacionService.cargarEvidencias({
      instalacionId: id,
      empresaId,
      subidoPorId: req.user?.id ?? 1,
      file,
      tipo: dto.tipo,
      descripcion: dto.descripcion ?? null,
      orden: dto.orden ?? 0,
    });
  }

  @Delete('delete-all')
  async deleteAll() {
    const detalle = await this.clienteInstalacionService.deleteAll();
    return detalle;
  }
}
