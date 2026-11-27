import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { CrearContratoClienteUseCase } from '../../application/use-cases/crear-contrato-cliente.use-case';
import { ObtenerDocumentoContratoUseCase } from '../../application/use-cases/obtener-documento-contrato.use-case';
import { CrearContratoClienteDto } from '../dto/crear-contrato-cliente.dto';
import { ObtenerDocumentoContratoQueryDto } from '../dto/obtener-documento-contrato-query.dto';
import { ContratoClientePresenter } from '../presenters/contrato-cliente.presenter';

@ApiTags('contrato-cliente')
@Controller('contrato-cliente')
export class ContratoClienteController {
  constructor(
    private readonly crearContrato: CrearContratoClienteUseCase,
    private readonly obtenerDocumento: ObtenerDocumentoContratoUseCase,
  ) {}

  @Post()
  @Roles(...ROLES_OFICINA)
  async crear(@Body() dto: CrearContratoClienteDto) {
    const contrato = await this.crearContrato.execute({
      clienteId: dto.clienteId,
      fechaInstalacionProgramada: dto.fechaInstalacionProgramada,
      fechaPago: dto.fechaPago,
      costoInstalacion: dto.costoInstalacion,
      observaciones: dto.observaciones,
    });

    return ContratoClientePresenter.contrato(contrato);
  }

  @Get('documento')
  @Roles(...ROLES_OFICINA)
  async documento(@Query() query: ObtenerDocumentoContratoQueryDto) {
    return ContratoClientePresenter.documento(
      await this.obtenerDocumento.execute({
        instalacionId: query.instalacionId,
        plantillaId: query.plantillaId,
      }),
    );
  }
}
