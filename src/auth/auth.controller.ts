import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/regist-user')
  createUserWithAuth(@Body() createAuthDto: CreateAuthDto) {
    console.log('La data llegando al regist user es: ', createAuthDto);

    return this.authService.register(createAuthDto);
  }

  @Post('/login-user')
  loginUserWithAuth(@Body() loginUserDto: LoginDto) {
    console.log('La data llegando al login es: ', loginUserDto);
    return this.authService.login(loginUserDto.correo, loginUserDto.contrasena);
  }
}
