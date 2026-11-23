import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Get,
  UseGuards,
  Req,
  UnauthorizedException,
  ForbiddenException,
  Patch,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto'; // Asumo que tienes este DTO
import { JwtAuthGuard } from './JwtGuard/jwt-auth.guard';
import { LimitarIntentosLogin } from './throttling/auth-throttling';

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;

    sub?: number;

    userId?: number;

    nombre: string;

    correo: string;

    rol: string;

    activo: boolean;

    empresaId: number;
  };
}

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

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

  @Post('/login-user')
  @LimitarIntentosLogin()
  @HttpCode(HttpStatus.OK)
  async loginUserWithAuth(@Body() loginUserDto: LoginDto) {
    let resultado = await this.authService.login(
      loginUserDto.correo,
      loginUserDto.contrasena,
    );

    return resultado;
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
