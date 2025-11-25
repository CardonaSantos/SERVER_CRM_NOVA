import {
  HttpException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { mapPrismaErrorToHttpException } from './mapErrors';

const isProd = process.env.NODE_ENV === 'production';

export function throwFatalError(
  error: unknown,
  logger: Logger,
  modulo: string,
): never {
  if (error instanceof Error) {
    logger.error(`Error en módulo: ${modulo} - ${error.message}`, error.stack);
  } else {
    logger.error(
      `Error en módulo: ${modulo} - Error no estándar`,
      JSON.stringify(error),
    );
  }

  if (error instanceof HttpException) {
    throw error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const httpMapped = mapPrismaErrorToHttpException(error, modulo);
    throw httpMapped;
  }

  if (error instanceof Error) {
    // En dev podemos mandar más detalle al frontend
    const responseBody = isProd
      ? {
          statusCode: 500,
          message: 'Ha ocurrido un error interno en el servidor',
          errorCode: 'INTERNAL_SERVER_ERROR',
        }
      : {
          statusCode: 500,
          message: `[${modulo}] ${error.message}`,
          errorCode: 'INTERNAL_SERVER_ERROR',
          details: {
            name: error.name,
            stack: error.stack,
          },
        };

    throw new InternalServerErrorException(responseBody);
  }

  throw new InternalServerErrorException({
    statusCode: 500,
    message: 'Ha ocurrido un error inesperado',
    errorCode: 'UNKNOWN_ERROR',
    details: !isProd ? { rawError: error } : undefined,
  });
}
