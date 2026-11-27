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
import { EditarFacturaUseCase } from '../../application/use-cases/editar-factura.use-case';
import { EliminarFacturaUseCase } from '../../application/use-cases/eliminar-factura.use-case';
import { EliminarPagoUseCase } from '../../application/use-cases/eliminar-pago.use-case';
import { GenerarFacturaUseCase } from '../../application/use-cases/generar-factura.use-case';
import { GenerarFacturasUseCase } from '../../application/use-cases/generar-facturas.use-case';
import { ListarFacturasUseCase } from '../../application/use-cases/listar-facturas.use-case';
import { ObtenerFacturaDetalleUseCase } from '../../application/use-cases/obtener-factura-detalle.use-case';
import { ObtenerFacturaEdicionUseCase } from '../../application/use-cases/obtener-factura-edicion.use-case';
import { ObtenerFacturaImpresionUseCase } from '../../application/use-cases/obtener-factura-impresion.use-case';
import { RegistrarPagoOficinaUseCase } from '../../application/use-cases/registrar-pago-oficina.use-case';
import { RegistrarPagoRutaUseCase } from '../../application/use-cases/registrar-pago-ruta.use-case';
import { EditarFacturaDto } from '../dto/editar-factura.dto';
import {
  EliminarFacturaDto,
  EliminarPagoDto,
} from '../dto/eliminar-factura.dto';
import {
  GenerarFacturaDto,
  GenerarFacturasDto,
} from '../dto/generar-factura.dto';
import { ListarFacturasQueryDto } from '../dto/listar-facturas-query.dto';
import {
  RegistrarPagoDto,
  RegistrarPagoRutaDto,
} from '../dto/registrar-pago.dto';
import { FacturaPresenter } from '../presenters/factura.presenter';

// Abiertas a cualquier sesión hasta que el dueño defina los permisos.
@ApiTags('facturacion')
@Controller('facturacion')
export class FacturacionController {
  constructor(
    private readonly pagarEnOficina: RegistrarPagoOficinaUseCase,
    private readonly pagarEnRuta: RegistrarPagoRutaUseCase,
    private readonly eliminarPago: EliminarPagoUseCase,
    private readonly generarFactura: GenerarFacturaUseCase,
    private readonly generarFacturas: GenerarFacturasUseCase,
    private readonly editarFactura: EditarFacturaUseCase,
    private readonly eliminarFactura: EliminarFacturaUseCase,
    private readonly listarFacturas: ListarFacturasUseCase,
    private readonly obtenerDetalle: ObtenerFacturaDetalleUseCase,
    private readonly obtenerImpresion: ObtenerFacturaImpresionUseCase,
    private readonly obtenerEdicion: ObtenerFacturaEdicionUseCase,
  ) {}

  @Post('create-new-payment')
  async registrarPago(
    @Body() dto: RegistrarPagoDto,
    @Actor() actor: ActorHttp,
  ) {
    return FacturaPresenter.pagoRegistrado(
      await this.pagarEnOficina.execute({
        usuarioId: actor.usuarioId,
        facturaId: dto.facturaInternetId,
        clienteId: dto.clienteId,
        montoPagado: dto.montoPagado,
        metodoPago: dto.metodoPago,
        numeroBoleta: dto.numeroBoleta,
        fechaPago: dto.fechaPago,
      }),
    );
  }

  @Post('create-new-payment-for-ruta')
  async registrarPagoRuta(
    @Body() dto: RegistrarPagoRutaDto,
    @Actor() actor: ActorHttp,
  ) {
    return FacturaPresenter.pagoRegistrado(
      await this.pagarEnRuta.execute({
        usuarioId: actor.usuarioId,
        rutaId: dto.rutaId,
        facturaId: dto.facturaInternetId,
        clienteId: dto.clienteId,
        montoPagado: dto.montoPagado,
        metodoPago: dto.metodoPago,
        numeroBoleta: dto.numeroBoleta,
      }),
    );
  }

  @Delete('delete-one-payment/:id')
  async borrarPago(
    @Param('id', ParseIntPipe) pagoId: number,
    @Body() dto: EliminarPagoDto,
    @Actor() actor: ActorHttp,
  ) {
    return FacturaPresenter.pagoEliminado(
      await this.eliminarPago.execute({
        pagoId,
        usuarioId: actor.usuarioId,
        motivo: dto.motivo,
      }),
    );
  }

  @Post('generate-factura-internet')
  async generar(@Body() dto: GenerarFacturaDto, @Actor() actor: ActorHttp) {
    return FacturaPresenter.guardada(
      await this.generarFactura.execute({
        usuarioId: actor.usuarioId,
        clienteId: dto.clienteId,
        anio: dto.anio,
        mes: dto.mes,
      }),
    );
  }

  @Post('generate-factura-internet-multiple')
  async generarVarias(
    @Body() dto: GenerarFacturasDto,
    @Actor() actor: ActorHttp,
  ) {
    const facturas = await this.generarFacturas.execute({
      usuarioId: actor.usuarioId,
      clienteId: dto.clienteId,
      anio: dto.anio,
      mesInicio: dto.mesInicio,
      mesFin: dto.mesFin,
    });

    return facturas.map((factura) => FacturaPresenter.guardada(factura));
  }

  @Patch('update-factura/:id')
  async editar(
    @Param('id', ParseIntPipe) facturaId: number,
    @Body() dto: EditarFacturaDto,
    @Actor() actor: ActorHttp,
  ) {
    return FacturaPresenter.guardada(
      await this.editarFactura.execute({
        facturaId,
        usuarioId: actor.usuarioId,
        cambios: {
          montoPago: dto.montoPago,
          detalleFactura: dto.detalleFactura,
          fechaPagoEsperada: dto.fechaPagoEsperada,
        },
        anulada: dto.anulada,
      }),
    );
  }

  @Delete('delete-one-factura')
  async borrarFactura(
    @Body() dto: EliminarFacturaDto,
    @Actor() actor: ActorHttp,
  ) {
    return FacturaPresenter.eliminada(
      await this.eliminarFactura.execute({
        facturaId: dto.facturaId,
        usuarioId: actor.usuarioId,
        motivo: dto.motivo,
      }),
    );
  }

  @Get('facturacion-to-table')
  async listar(@Query() query: ListarFacturasQueryDto) {
    return FacturaPresenter.listado(
      await this.listarFacturas.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        zonaId: query.zonaId,
        municipioId: query.municipioId,
        departamentoId: query.departamentoId,
        sectorId: query.sectorId,
        estado: query.estado,
      }),
    );
  }

  @Get('get-facturacion-with-payments/:id')
  async detalle(@Param('id', ParseIntPipe) id: number) {
    return FacturaPresenter.detalle(await this.obtenerDetalle.execute(id));
  }

  @Get('factura-to-pdf/:id')
  async impresion(@Param('id', ParseIntPipe) id: number) {
    return FacturaPresenter.impresion(await this.obtenerImpresion.execute(id));
  }

  @Get('get-factura-to-edit/:id')
  async paraEditar(@Param('id', ParseIntPipe) id: number) {
    return FacturaPresenter.edicion(await this.obtenerEdicion.execute(id));
  }
}
