import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from './JwtGuard/jwt-auth.guard';
import { UsuarioAutenticado } from './JwtGuard/jwt-payload';
import { ContextoCliente } from './sesiones/auditoria-auth.service';
import { MOTIVO_REVOCACION } from './sesiones/sesion.constants';
import { SesionesService } from './sesiones/sesiones.service';
import {
  LimitarIntentosLogin,
  LimitarIntentosRefresh,
} from './throttling/auth-throttling';

type AuthenticatedRequest = Request & { user?: UsuarioAutenticado };

/** IP (vía trust proxy) y user-agent recortado, para sesión y bitácora. */
function contextoCliente(request: Request): ContextoCliente {
  const userAgent = request.headers['user-agent'];

  return {
    ip: request.ip ?? null,
    userAgent:
      typeof userAgent === 'string' && userAgent.length > 0
        ? userAgent.slice(0, 255)
        : null,
  };
}

function usuarioDe(request: AuthenticatedRequest): UsuarioAutenticado {
  if (!request.user) {
    throw new UnauthorizedException(
      'No fue posible identificar al usuario autenticado.',
    );
  }
  return request.user;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly sesionesService: SesionesService,
  ) {}

  /*
   * Solo un SUPER_ADMIN autenticado puede crear usuarios.
   * Antes era público: cualquiera podía crearse un SUPER_ADMIN.
   * Provisional hasta que exista RolesGuard + @Roles (etapa 7).
   */
  @Post('/regist-user')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createUserWithAuth(
    @Req() request: AuthenticatedRequest,
    @Body() createAuthDto: CreateAuthDto,
  ) {
    if (request.user?.rol !== RolUsuario.SUPER_ADMIN) {
      throw new ForbiddenException(
        'No tiene permisos para registrar usuarios.',
      );
    }

    return this.authService.register(createAuthDto);
  }

  /**
   * Respuesta: { access_token, refresh_token, token_type, expires_in, user }.
   * `plataforma` ('WEB' | 'ANDROID') e `instalacionId` (Android) son
   * opcionales: sin ellos la sesión es WEB.
   */
  @Post('/login-user')
  @LimitarIntentosLogin()
  @HttpCode(HttpStatus.OK)
  loginUserWithAuth(@Body() loginUserDto: LoginDto, @Req() request: Request) {
    return this.authService.login(
      loginUserDto?.correo,
      loginUserDto?.contrasena,
      {
        plataforma: loginUserDto?.plataforma,
        instalacionId: loginUserDto?.instalacionId,
        ...contextoCliente(request),
      },
    );
  }

  /**
   * Canjea un refresh token por un par nuevo (rotación). Un refresh ya
   * canjeado no vuelve a servir; presentarlo de nuevo revoca la sesión.
   */
  @Post('/refresh')
  @LimitarIntentosRefresh()
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: RefreshDto, @Req() request: Request) {
    return this.sesionesService.refrescar(
      body?.refresh_token,
      contextoCliente(request),
    );
  }

  /** Cierra la sesión actual: access y refresh dejan de servir de inmediato. */
  @Post('/logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() request: AuthenticatedRequest) {
    const usuario = usuarioDe(request);

    await this.sesionesService.revocarSesion(
      usuario.sesionId,
      MOTIVO_REVOCACION.LOGOUT,
    );

    return { revocada: true };
  }

  /** Sesiones vigentes del usuario autenticado; `actual` marca la de esta petición. */
  @Get('/sesiones')
  @UseGuards(JwtAuthGuard)
  listarSesiones(@Req() request: AuthenticatedRequest) {
    const usuario = usuarioDe(request);

    return this.sesionesService.listarActivas(usuario.id, usuario.sesionId);
  }

  /** Cierra todas las sesiones del usuario excepto la actual. */
  @Post('/sesiones/cerrar-otras')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cerrarOtras(@Req() request: AuthenticatedRequest) {
    const usuario = usuarioDe(request);

    const revocadas = await this.sesionesService.revocarOtras(
      usuario.id,
      usuario.sesionId,
      MOTIVO_REVOCACION.CERRAR_OTRAS,
    );

    return { revocadas };
  }

  /** Cierra una sesión propia (p. ej. un teléfono perdido). */
  @Delete('/sesiones/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revocarSesion(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) sesionId: string,
  ) {
    const usuario = usuarioDe(request);

    await this.sesionesService.revocarPropia(usuario.id, sesionId);

    return { revocada: true };
  }

  /*
   * =======================================================
   * CURRENT AUTHENTICATED USER
   * =======================================================
   *
   * Contrato consumido por:
   *
   * ANDROID-BASE
   * GET /auth/profile
   */
  @Get('/profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(
    @Req()
    request: AuthenticatedRequest,
  ) {
    const usuarioId = Number(request.user?.id);

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al usuario autenticado.',
      );
    }

    return this.authService.getAuthenticatedProfile(usuarioId);
  }
}
