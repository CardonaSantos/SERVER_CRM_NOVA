import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError } from 'axios';
import { lastValueFrom } from 'rxjs';
import { MensajeriaProveedorNoDisponibleError } from '../../domain/errors/mensajeria-cliente.errors';
import { CuerpoErrorMeta, traducirErrorMeta } from './meta-error.mapper';

const ESPERA_MAXIMA_MS = 20_000;

/** El tipo sale de `HttpService` para usar las mismas definiciones de axios. */
type PeticionMeta = Pick<
  Parameters<HttpService['request']>[0],
  'method' | 'params' | 'data' | 'maxBodyLength'
> & { headers?: Record<string, string> };

export type VariableMeta =
  | 'WHATSAPP_PHONE_ID'
  | 'WHATSAPP_WABA_ID'
  | 'META_APP_ID';

/** Acceso a Graph API: configuración, autorización y errores. */
@Injectable()
export class MetaGraphAdapter {
  private readonly logger = new Logger(MetaGraphAdapter.name);

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  /** Valor obligatorio de la configuración; si falta, no se llama a Meta. */
  requerido(nombre: VariableMeta | 'WHATSAPP_API_TOKEN'): string {
    const valor = this.config.get<string>(nombre);
    if (!valor) {
      this.logger.error(`Falta la variable de entorno ${nombre}`);
      throw new MensajeriaProveedorNoDisponibleError();
    }
    return valor;
  }

  async pedir<T>(
    operacion: string,
    ruta: string,
    peticion: PeticionMeta,
    esquema: 'Bearer' | 'OAuth' = 'Bearer',
  ): Promise<T> {
    const version = this.config.get<string>('META_GRAPH_VERSION') ?? 'v21.0';
    const token = this.requerido('WHATSAPP_API_TOKEN');

    try {
      const { data } = await lastValueFrom(
        this.http.request<T>({
          timeout: ESPERA_MAXIMA_MS,
          ...peticion,
          url: `https://graph.facebook.com/${version}/${ruta}`,
          headers: {
            ...peticion.headers,
            Authorization: `${esquema} ${token}`,
          },
        }),
      );
      return data;
    } catch (error) {
      // Solo códigos: el cuerpo puede traer teléfonos y textos de clientes.
      const fallo = error as AxiosError<CuerpoErrorMeta>;
      this.logger.warn(
        `${operacion} falló: status ${fallo.response?.status ?? '-'}, ` +
          `código ${fallo.response?.data?.error?.code ?? fallo.code ?? '-'}`,
      );
      throw traducirErrorMeta(error);
    }
  }
}
