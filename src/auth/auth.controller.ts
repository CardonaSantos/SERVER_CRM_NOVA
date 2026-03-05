import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto'; // Asumo que tienes este DTO

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
}
