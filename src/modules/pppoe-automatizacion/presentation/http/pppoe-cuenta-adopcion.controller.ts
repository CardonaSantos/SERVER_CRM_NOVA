import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { Roles } from 'src/auth/decoradores/roles.decorator';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';

import { AdoptarCuentaPppoeExistenteUseCase } from '../../application/use-cases/adoptar-cuenta-pppoe-existente.use-case';
import { VerificarAdopcionPppoeUseCase } from '../../application/use-cases/verificar-adopcion-pppoe.use-case';
import {
  AdoptarCuentaPppoeExistenteDto,
  VerificarAdopcionPppoeDto,
} from '../dto/adopcion-pppoe.dto';

/**
 * Registra en el CRM cuentas PPPoE que ya existían en el MikroTik. Solo lee
 * el router: no crea secrets ni cambia contraseñas ni su estado.
 */
@Controller('pppoe-cuentas/adopcion')
export class PppoeCuentaAdopcionController {
  constructor(
    private readonly verificarAdopcion: VerificarAdopcionPppoeUseCase,
    private readonly adoptarCuenta: AdoptarCuentaPppoeExistenteUseCase,
  ) {}

  /**
   * Comprueba sin guardar nada que el secret exista en el router y coincida
   * (contraseña, profile, service) y que el cliente y el usuario estén libres.
   */
  @Post('verificar')
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.OK)
  verificar(@Body() dto: VerificarAdopcionPppoeDto, @Actor() actor: ActorHttp) {
    return this.verificarAdopcion.execute({
      empresaId: actor.empresaId,
      clienteId: dto.clienteId,
      perfilHomologacionId: dto.perfilHomologacionId,
      usuarioPppoe: dto.usuarioPppoe,
      // La contraseña va tal como llegó: sin trim.
      passwordPppoe: dto.passwordPppoe,
    });
  }

  /**
   * Adopción definitiva. No confía en una verificación previa: vuelve a
   * comprobar el router y guarda acceso, cuenta y auditoría en una transacción.
   */
  @Post()
  @Roles(...ROLES_OFICINA)
  @HttpCode(HttpStatus.CREATED)
  adoptar(
    @Body() dto: AdoptarCuentaPppoeExistenteDto,
    @Actor() actor: ActorHttp,
  ) {
    return this.adoptarCuenta.execute({
      empresaId: actor.empresaId,
      clienteId: dto.clienteId,
      perfilHomologacionId: dto.perfilHomologacionId,
      usuarioPppoe: dto.usuarioPppoe,
      passwordPppoe: dto.passwordPppoe,
      operadorId: actor.usuarioId,
    });
  }
}
