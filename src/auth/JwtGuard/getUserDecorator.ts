import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetToken = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // e.g. "Bearer <token>"
    const authHeader = request.headers.authorization || '';
    return authHeader.split(' ')[1] || null;
  },
);
