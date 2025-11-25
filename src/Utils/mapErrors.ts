import {
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
const isProd = process.env.NODE_ENV === 'production';

export function mapPrismaErrorToHttpException(
  error: Prisma.PrismaClientKnownRequestError,
  modulo: string,
): HttpException {
  // Puedes ir ampliando estos códigos según uses más
  switch (error.code) {
    case 'P2025': {
      // Registro no encontrado
      return new NotFoundException({
        statusCode: 404,
        message: 'El recurso solicitado no existe o ya fue eliminado',
        errorCode: 'PRISMA_RECORD_NOT_FOUND',
        details: !isProd
          ? {
              modulo,
              prismaCode: error.code,
              meta: error.meta,
            }
          : undefined,
      });
    }

    case 'P2002': {
      // Unique constraint
      return new ConflictException({
        statusCode: 409,
        message:
          'Ya existe un registro con estos datos (violación de unicidad)',
        errorCode: 'PRISMA_UNIQUE_CONSTRAINT',
        details: !isProd
          ? {
              modulo,
              prismaCode: error.code,
              meta: error.meta,
            }
          : undefined,
      });
    }

    default: {
      // Otros errores de Prisma
      return new InternalServerErrorException({
        statusCode: 500,
        message: 'Error al acceder a la base de datos',
        errorCode: 'PRISMA_UNKNOWN_ERROR',
        details: !isProd
          ? {
              modulo,
              prismaCode: error.code,
              meta: error.meta,
            }
          : undefined,
      });
    }
  }
}
