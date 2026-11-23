import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/JwtGuard/jwt-auth.guard';

import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';

import { PushDispositivosService } from '../app/push-dispositivos.service';
import {
  RegisterPushDispositivoDto,
  RevokePushDispositivoDto,
} from '../dto/push-dispositivo.dto';

@Controller('push-dispositivos')
@UseGuards(JwtAuthGuard)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class PushDispositivosController {
  constructor(
    private readonly pushDispositivosService: PushDispositivosService,
  ) {}

  /*
   * =========================================================
   * REGISTER / REFRESH CURRENT INSTALLATION
   * =========================================================
   *
   * POST /push-dispositivos/register
   *
   * Authorization:
   * Bearer <JWT>
   *
   * Body:
   * {
   *   instalacionId,
   *   token,
   *   nombreDispositivo?,
   *   modeloDispositivo?,
   *   versionApp?
   * }
   *
   * usuarioId NO viene del cliente.
   * Sale del JWT validado por JwtAuthGuard.
   * =========================================================
   */

  @Post('register')
  @HttpCode(HttpStatus.OK)
  registrar(
    @GetUserAuthToken('userId')
    userId: number,

    @Body()
    dto: RegisterPushDispositivoDto,
  ) {
    const usuarioId = this.requireAuthenticatedUserId(userId);

    return this.pushDispositivosService.registrar(usuarioId, dto);
  }

  /*
   * =========================================================
   * REVOKE CURRENT INSTALLATION
   * =========================================================
   *
   * DELETE /push-dispositivos/current
   *
   * Principalmente para logout.
   *
   * Es idempotente:
   *
   * - primera llamada:
   *      revoked = true
   *
   * - llamadas posteriores:
   *      revoked = false
   *
   * No produce 404 por intentar revocar otra vez.
   * =========================================================
   */

  @Delete('current')
  @HttpCode(HttpStatus.OK)
  revocar(
    @GetUserAuthToken('userId')
    userId: number,

    @Body()
    dto: RevokePushDispositivoDto,
  ) {
    const usuarioId = this.requireAuthenticatedUserId(userId);

    return this.pushDispositivosService.revocar(usuarioId, dto);
  }

  /*
   * =========================================================
   * AUTH INVARIANT
   * =========================================================
   *
   * JwtAuthGuard debería garantizar esto.
   *
   * Aun así lo verificamos porque no queremos permitir que
   * un cambio accidental en el guard termine produciendo
   * consultas Prisma con usuarioId undefined/null.
   * =========================================================
   */

  private requireAuthenticatedUserId(userId: unknown): number {
    if (
      typeof userId !== 'number' ||
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new UnauthorizedException(
        'No fue posible identificar al usuario autenticado.',
      );
    }

    return userId;
  }
}
