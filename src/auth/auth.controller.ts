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
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto'; // Asumo que tienes este DTO
import { JwtAuthGuard } from './JwtGuard/jwt-auth.guard';

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

  @Post('/regist-user')
  @HttpCode(HttpStatus.CREATED)
  createUserWithAuth(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/login-user')
  @HttpCode(HttpStatus.OK)
  async loginUserWithAuth(@Body() loginUserDto: LoginDto) {
    console.log(`Intento de login para: ${loginUserDto.correo}`);

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
