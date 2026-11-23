import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { BaseWsExceptionFilter } from '@nestjs/websockets';
import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';

const MENSAJE_GENERICO = 'Ha ocurrido un error interno en el servidor';

/** Códigos que pone throwFatalError: su `message` puede traer detalle interno. */
const CODIGOS_INTERNOS = new Set(['INTERNAL_SERVER_ERROR', 'UNKNOWN_ERROR']);

const REQUEST_ID_VALIDO = /^[A-Za-z0-9._-]{8,64}$/;

/**
 * Filtro global de excepciones (etapa 7).
 *
 * - < 500: idéntico al comportamiento de Nest (BaseExceptionFilter). El
 *   front no ve ningún cambio en 400/401/403/404/409/429.
 * - 501–599: también idéntico (son deliberados, p. ej. router no
 *   disponible).
 * - 500 y errores no controlados: se registran con stack, método, ruta,
 *   usuario y un requestId; al cliente NUNCA le llegan stack, `details`
 *   ni el mensaje interno de throwFatalError (antes dependía de que
 *   NODE_ENV fuera 'production'). Recibe { statusCode, message,
 *   errorCode, requestId } y la cabecera X-Request-ID para reportarlo.
 *   Los 500 con mensaje deliberado (sin errorCode interno) lo conservan.
 *
 * EXPONER_DETALLE_ERRORES=true agrega `detalle` a los 500 (solo para
 * depurar en local; nunca en Railway).
 */
@Catch()
export class FiltroGlobalExcepciones extends BaseExceptionFilter {
  private readonly logger = new Logger('Excepciones');

  private readonly exponerDetalle =
    process.env.EXPONER_DETALLE_ERRORES === 'true';

  private readonly filtroWs = new BaseWsExceptionFilter();

  catch(exception: unknown, host: ArgumentsHost) {
    // Gateways WS: el comportamiento estándar de Nest para sockets.
    if (host.getType() === 'ws') {
      return this.filtroWs.catch(exception, host);
    }

    if (host.getType() !== 'http') {
      return super.catch(exception, host);
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status !== HttpStatus.INTERNAL_SERVER_ERROR) {
      return super.catch(exception, host);
    }

    const http = host.switchToHttp();
    const request = http.getRequest<Request & { user?: { id?: number } }>();
    const response = http.getResponse<Response>();

    const recibido = request.headers['x-request-id'];
    const requestId =
      typeof recibido === 'string' && REQUEST_ID_VALIDO.test(recibido)
        ? recibido
        : randomUUID();

    const original =
      exception instanceof HttpException ? exception.getResponse() : null;
    const cuerpo =
      original && typeof original === 'object'
        ? (original as Record<string, unknown>)
        : {};

    const errorCode =
      typeof cuerpo.errorCode === 'string'
        ? cuerpo.errorCode
        : 'INTERNAL_SERVER_ERROR';

    // Mensaje deliberado de una InternalServerErrorException propia: se
    // conserva. El de throwFatalError o un error no controlado: genérico.
    let mensajeDeliberado: string | null = null;

    if (
      exception instanceof HttpException &&
      !CODIGOS_INTERNOS.has(String(cuerpo.errorCode))
    ) {
      const m = typeof original === 'string' ? original : cuerpo.message;
      if (typeof m === 'string' && m !== 'Internal Server Error') {
        mensajeDeliberado = m;
      }
    }

    const mensajeInterno =
      exception instanceof Error ? exception.message : String(exception);

    this.logger.error(
      `[${requestId}] ${request.method} ${request.route?.path ?? request.path} → 500 (usuario ${request.user?.id ?? '-'}): ${mensajeInterno}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    const body: Record<string, unknown> = {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: mensajeDeliberado ?? MENSAJE_GENERICO,
      errorCode,
      requestId,
    };

    if (this.exponerDetalle) {
      body.detalle = { mensaje: mensajeInterno, original };
    }

    response.setHeader('X-Request-ID', requestId);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
