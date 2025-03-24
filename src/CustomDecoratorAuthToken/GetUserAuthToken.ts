import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetUserAuthToken = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    console.log('Ejecutando el decorador custom');

    // Si el usuario no existe, devolvemos null para evitar errores
    return data ? request.user?.[data] || null : request.user || null;
  },
);
