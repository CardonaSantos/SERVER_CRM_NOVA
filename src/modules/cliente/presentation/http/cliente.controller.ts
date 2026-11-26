import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { ActualizarClienteUseCase } from '../../application/use-cases/actualizar-cliente.use-case';
import { CrearClienteUseCase } from '../../application/use-cases/crear-cliente.use-case';
import { EliminarClienteUseCase } from '../../application/use-cases/eliminar-cliente.use-case';
import { EstadoOperativoCliente } from '../../domain/enums/estado-operativo-cliente.enum';
import { ActualizarClienteDto } from '../dto/actualizar-cliente.dto';
import { CrearClienteDto } from '../dto/crear-cliente.dto';
import { EliminarClienteDto } from '../dto/eliminar-cliente.dto';
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
  ) {}

  /** Alta con IP, ubicación, servicios, primera factura y contrato. */
  @Post('create-new-customer')
  async crear(@Body() dto: CrearClienteDto) {
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
          empresaId: dto.empresaId,
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
        // Un valor vacío no desasigna; solo el router admite `null`.
        asignaciones: {
          facturacionZonaId: dto.zonaFacturacionId || undefined,
          servicioInternetId: dto.servicioWifiId || undefined,
          municipioId: dto.municipioId || undefined,
          departamentoId: dto.departamentoId || undefined,
          sectorId: dto.sectorId || undefined,
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
