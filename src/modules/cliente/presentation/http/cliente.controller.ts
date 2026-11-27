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
import { ActualizarClienteUseCase } from '../../application/use-cases/actualizar-cliente.use-case';
import { CrearClienteUseCase } from '../../application/use-cases/crear-cliente.use-case';
import { EliminarClienteUseCase } from '../../application/use-cases/eliminar-cliente.use-case';
import { ListarClientesCampaniaUseCase } from '../../application/use-cases/listar-clientes-campania.use-case';
import { ListarClientesRutaUseCase } from '../../application/use-cases/listar-clientes-ruta.use-case';
import { ListarClientesUseCase } from '../../application/use-cases/listar-clientes.use-case';
import { ListarOpcionesClienteUseCase } from '../../application/use-cases/listar-opciones-cliente.use-case';
import { ObtenerClienteEdicionUseCase } from '../../application/use-cases/obtener-cliente-edicion.use-case';
import { ObtenerDetalleClienteUseCase } from '../../application/use-cases/obtener-detalle-cliente.use-case';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';
import { ActualizarClienteDto } from '../dto/actualizar-cliente.dto';
import { CrearClienteDto } from '../dto/crear-cliente.dto';
import { EliminarClienteDto } from '../dto/eliminar-cliente.dto';
import { ListarClientesCampaniaQueryDto } from '../dto/listar-clientes-campania-query.dto';
import { ListarClientesQueryDto } from '../dto/listar-clientes-query.dto';
import { ListarClientesRutaQueryDto } from '../dto/listar-clientes-ruta-query.dto';
import { ClienteFichaPresenter } from '../presenters/cliente-ficha.presenter';
import { ClienteListadoPresenter } from '../presenters/cliente-listado.presenter';
import { ClientePresenter } from '../presenters/cliente.presenter';

/** Sin número de contrato no se crea ni se toca el contrato. */
function contratoDe(dto: CrearClienteDto | ActualizarClienteDto) {
  if (!dto.idContrato) return null;

  return {
    idContrato: dto.idContrato,
    fechaFirma: dto.fechaFirma ? new Date(dto.fechaFirma) : undefined,
    archivoContrato: dto.archivoContrato,
    observaciones: dto.observacionesContrato,
  };
}

@ApiTags('clientes')
@Controller('internet-customer')
export class ClienteController {
  constructor(
    private readonly crearCliente: CrearClienteUseCase,
    private readonly actualizarCliente: ActualizarClienteUseCase,
    private readonly eliminarCliente: EliminarClienteUseCase,
    private readonly listarClientes: ListarClientesUseCase,
    private readonly listarParaRuta: ListarClientesRutaUseCase,
    private readonly listarParaCampania: ListarClientesCampaniaUseCase,
    private readonly listarOpciones: ListarOpcionesClienteUseCase,
    private readonly obtenerDetalle: ObtenerDetalleClienteUseCase,
    private readonly obtenerEdicion: ObtenerClienteEdicionUseCase,
  ) {}

  /** Tabla de clientes con su clasificación de crédito y la cartera. */
  @Get('customer-to-table')
  async tabla(@Query() query: ListarClientesQueryDto) {
    return ClienteListadoPresenter.tabla(
      await this.listarClientes.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        zonaId: query.zonaId,
        municipioId: query.municipioId,
        departamentoId: query.departamentoId,
        sectorId: query.sectorId,
        estado: query.estado,
        estadoCobranza: query.estadoCobranza,
      }),
    );
  }

  /** Clientes para armar una ruta de cobro. */
  @Get('get-customers-ruta')
  async paraRuta(@Query() query: ListarClientesRutaQueryDto) {
    return ClienteListadoPresenter.listadoRuta(
      await this.listarParaRuta.execute({
        page: query.page,
        limit: query.limit,
        search: query.search,
        estado: query.estado,
        estadoCobranza: query.estadoCobranza,
        zonaIds: query.zonaIds,
        sectorIds: query.sectorIds,
        sortBy: query.sortBy,
        sortDir: query.sortDir,
      }),
    );
  }

  /** Destinatarios posibles de una campaña. */
  @Get('whatsapp-campaing')
  async paraCampania(@Query() query: ListarClientesCampaniaQueryDto) {
    return ClienteListadoPresenter.campania(
      await this.listarParaCampania.execute({
        nombre: query.nombre,
        zonaId: query.zonaId,
        sectorId: query.sectorId,
        municipioId: query.municipioId,
        departamentoId: query.departamentoId,
        estado: query.estado,
        estadoCobranza: query.estadoCobranza,
        facturasPendientes: query.facturasPendientes,
      }),
    );
  }

  /** Clientes para un selector. */
  @Get('get-customers-to-ticket')
  async opciones() {
    return ClienteListadoPresenter.opciones(
      await this.listarOpciones.execute(),
    );
  }

  /** Ficha completa, con facturas, pagos y tickets. */
  @Get('get-customer-details/:id')
  async detalle(@Param('id', ParseIntPipe) clienteId: number) {
    return ClienteFichaPresenter.detalle(
      await this.obtenerDetalle.execute({ clienteId }),
    );
  }

  /** Datos del formulario de edición. */
  @Get('get-customer-to-edit/:id')
  async paraEditar(@Param('id', ParseIntPipe) clienteId: number) {
    return ClienteFichaPresenter.edicion(
      await this.obtenerEdicion.execute({ clienteId }),
    );
  }

  /** Alta con IP, ubicación, servicios, primera factura y contrato. */
  @Post('create-new-customer')
  async crear(@Body() dto: CrearClienteDto, @Actor() actor: ActorHttp) {
    return ClientePresenter.guardado(
      await this.crearCliente.execute({
        cliente: {
          nombre: dto.nombre,
          apellidos: dto.apellidos,
          estadoInicial: dto.estado ?? EstadoOperativoCliente.ACTIVO,
          telefono: dto.telefono,
          direccion: dto.direccion,
          dpi: dto.dpi,
          observaciones: dto.observaciones,
          contactoReferenciaNombre: dto.contactoReferenciaNombre,
          contactoReferenciaTelefono: dto.contactoReferenciaTelefono,
          contrasenaWifi: dto.contrasenaWifi,
          ssidRouter: dto.ssidRouter,
          fechaInstalacion: dto.fechaInstalacion,
          empresaId: actor.empresaId,
          facturacionZonaId: dto.zonaFacturacionId,
          servicioInternetId: dto.servicioWifiId,
          municipioId: dto.municipioId,
          departamentoId: dto.departamentoId,
          sectorId: dto.sectorId || undefined,
          asesorId: dto.asesorId || undefined,
          mikrotikRouterId: dto.mkSelected || undefined,
        },
        ip: {
          direccionIp: dto.ip,
          gateway: dto.gateway,
          mascara: dto.mascara,
        },
        coordenadas: dto.coordenadas,
        servicioIds: dto.servicesIds,
        contrato: contratoDe(dto),
      }),
    );
  }

  /** Edición: lo que no llega no se modifica. La cobranza no se edita. */
  @Patch('update-customer/:id')
  async actualizar(
    @Param('id', ParseIntPipe) clienteId: number,
    @Body() dto: ActualizarClienteDto,
    @Actor() actor: ActorHttp,
  ) {
    return ClientePresenter.guardado(
      await this.actualizarCliente.execute({
        clienteId,
        usuarioId: actor.usuarioId,
        empresaId: actor.empresaId,
        perfil: {
          nombre: dto.nombre,
          apellidos: dto.apellidos,
          telefono: dto.telefono,
          direccion: dto.direccion,
          dpi: dto.dpi,
          observaciones: dto.observaciones,
          contactoReferenciaNombre: dto.contactoReferenciaNombre,
          contactoReferenciaTelefono: dto.contactoReferenciaTelefono,
          contrasenaWifi: dto.contrasenaWifi,
          ssidRouter: dto.ssidRouter,
          fechaInstalacion: dto.fechaInstalacion,
          enviarRecordatorio: dto.enviarRecordatorio,
        },
        // Un valor vacío no desasigna; solo router y sector admiten `null`.
        asignaciones: {
          facturacionZonaId: dto.zonaFacturacionId || undefined,
          servicioInternetId: dto.servicioWifiId || undefined,
          municipioId: dto.municipioId || undefined,
          departamentoId: dto.departamentoId || undefined,
          sectorId: dto.sectorId === null ? null : dto.sectorId || undefined,
          asesorId: dto.asesorId || undefined,
          mikrotikRouterId: dto.mikrotikRouterId,
        },
        estado: dto.estado,
        coordenadas: dto.coordenadas,
        servicioIds: dto.servicesIds,
        contrato: contratoDe(dto),
      }),
    );
  }

  /** Borrado lógico: conserva facturas, pagos e historial. */
  @Delete('delete-one-customer/:id')
  async eliminar(
    @Param('id', ParseIntPipe) clienteId: number,
    @Body() dto: EliminarClienteDto,
    @Actor() actor: ActorHttp,
  ) {
    return ClientePresenter.eliminado(
      await this.eliminarCliente.execute({
        clienteId,
        usuarioId: actor.usuarioId,
        empresaId: actor.empresaId,
        motivo: dto?.motivo,
        comentario: dto?.comentario,
      }),
    );
  }
}
