import {
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export async function throwFatalError(
  error: unknown,
  logger: Logger,
  modulo: string,
) {
  logger.error(`Error en módulo: ${modulo}, lanzando error: ${error}`);
  if (error instanceof HttpException) throw error;
  throw new InternalServerErrorException('Fatal Error: Error inesperado');
}
