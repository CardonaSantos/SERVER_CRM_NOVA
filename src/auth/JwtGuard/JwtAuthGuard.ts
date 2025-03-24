import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config'; // Asegúrate de inyectar el ConfigService
const MY_SECRET_TOKEN_KEY_CRM = 'MICLAVESECRETAPARAFIRMAR';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService, // Inyecta ConfigService para obtener la clave secreta
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1]; // Bearer <token>
    console.log('el token conseguido es: ', token);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Decodificando y validando el token
      const decoded = this.jwtService.verify(token, {
        secret: MY_SECRET_TOKEN_KEY_CRM,
      });
      request.user = decoded; // Guardamos la información decodificada del token en request.user
      return true;
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
