import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginDto } from './dto/login.dto'; // Asumo que tienes este DTO

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/regist-user')
  @HttpCode(HttpStatus.CREATED)
  createUserWithAuth(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @Post('/login-user')
  @HttpCode(HttpStatus.OK)
  loginUserWithAuth(@Body() loginUserDto: LoginDto) {
    console.log(`Intento de login para: ${loginUserDto.correo}`);
    return this.authService.login(loginUserDto.correo, loginUserDto.contrasena);
  }
}
