import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_SUPER_ADMIN } from 'src/auth/roles/grupos-roles';
import { ActualizarEmpresaUseCase } from '../../application/use-cases/actualizar-empresa.use-case';
import { ObtenerEmpresaUseCase } from '../../application/use-cases/obtener-empresa.use-case';
import { ActualizarEmpresaDto } from '../dto/actualizar-empresa.dto';
import { EmpresaPresenter } from '../presenters/empresa.presenter';

// Leer, cualquier sesión (encabezado de la UI); editar, solo super administrador.
@ApiTags('empresa')
@Controller('empresa')
export class EmpresaController {
  constructor(
    private readonly obtenerEmpresa: ObtenerEmpresaUseCase,
    private readonly actualizarEmpresa: ActualizarEmpresaUseCase,
  ) {}

  @Get()
  async obtener(@Actor() actor: ActorHttp) {
    return EmpresaPresenter.detalle(
      await this.obtenerEmpresa.execute({ empresaId: actor.empresaId }),
    );
  }

  @Get('resumen')
  async resumen(@Actor() actor: ActorHttp) {
    return EmpresaPresenter.resumen(
      await this.obtenerEmpresa.execute({ empresaId: actor.empresaId }),
    );
  }

  @Patch()
  @Roles(...ROLES_SUPER_ADMIN)
  async actualizar(
    @Body() dto: ActualizarEmpresaDto,
    @Actor() actor: ActorHttp,
  ) {
    const empresa = await this.actualizarEmpresa.execute({
      empresaId: actor.empresaId,
      cambios: {
        nombre: dto.nombre,
        direccion: dto.direccion,
        telefono: dto.telefono,
        pbx: dto.pbx,
        correo: dto.correo,
        sitioWeb: dto.sitioWeb,
        nit: dto.nit,
        logo1: dto.logo1,
        logo2: dto.logo2,
        logo3: dto.logo3,
      },
    });

    return EmpresaPresenter.detalle(empresa);
  }
}
