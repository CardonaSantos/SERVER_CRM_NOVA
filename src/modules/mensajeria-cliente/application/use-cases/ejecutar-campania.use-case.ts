import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { CampaniaEntity } from '../../domain/entities/campania.entity';
import { EstadoEnvio, MotivoEnvio } from '../../domain/enums/campania.enum';
import {
  MensajeriaProveedorNoDisponibleError,
  MensajeriaProveedorRechazoError,
} from '../../domain/errors/mensajeria-cliente.errors';
import {
  CAMPANIA_REPOSITORY,
  CampaniaRepositoryPort,
  EnvioReclamado,
} from '../../domain/ports/campania-repository.port';
import {
  PROVEEDOR_MENSAJES,
  ProveedorMensajesPort,
} from '../ports/proveedor-mensajes.port';

/** Tantas respuestas dudosas seguidas: algo anda mal y conviene parar. */
export const SIN_CONFIRMAR_SEGUIDOS_MAXIMO = 5;

/**
 * Envía uno por uno lo pendiente de una campaña. Cada destino se marca antes
 * de llamar a WhatsApp, así nunca se envía dos veces (estándar §5.6).
 */
@Injectable()
export class EjecutarCampaniaUseCase {
  private readonly logger = new Logger(EjecutarCampaniaUseCase.name);

  constructor(
    @Inject(CAMPANIA_REPOSITORY)
    private readonly campanias: CampaniaRepositoryPort,
    @Inject(PROVEEDOR_MENSAJES)
    private readonly proveedor: ProveedorMensajesPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: { campaniaId: number }): Promise<void> {
    const campania = await this.campanias.findById(input.campaniaId);
    if (!campania) return;

    let dudosos = 0;
    for (;;) {
      const envio = await this.campanias.tomarSiguiente(
        input.campaniaId,
        this.reloj.ahora(),
      );
      if (!envio) break;

      const estado = await this.enviar(campania, envio);
      dudosos = estado === EstadoEnvio.SIN_CONFIRMAR ? dudosos + 1 : 0;

      // PENDIENTE: WhatsApp no está disponible y este destino no salió.
      if (
        estado === EstadoEnvio.PENDIENTE ||
        dudosos >= SIN_CONFIRMAR_SEGUIDOS_MAXIMO
      ) {
        await this.campanias.interrumpir(input.campaniaId, this.reloj.ahora());
        this.logger.warn(`Campaña ${input.campaniaId} interrumpida`);
        return;
      }
    }

    await this.campanias.completar(input.campaniaId, this.reloj.ahora());
  }

  private async enviar(
    campania: CampaniaEntity,
    envio: EnvioReclamado,
  ): Promise<EstadoEnvio> {
    let mensajeId: string | null;
    try {
      ({ mensajeId } = await this.proveedor.enviar({
        telefono: envio.telefono,
        plantilla: campania.plantilla,
        idioma: campania.idioma,
        imagenUrl: campania.imagenUrl,
      }));
    } catch (error) {
      return this.registrarFallo(envio.id, error);
    }

    await this.campanias.registrarResultado(envio.id, {
      estado: EstadoEnvio.ENVIADO,
      mensajeProveedorId: mensajeId,
    });
    return EstadoEnvio.ENVIADO;
  }

  private async registrarFallo(
    envioId: number,
    error: unknown,
  ): Promise<EstadoEnvio> {
    if (error instanceof MensajeriaProveedorNoDisponibleError) {
      await this.campanias.registrarResultado(envioId, {
        estado: EstadoEnvio.PENDIENTE,
      });
      return EstadoEnvio.PENDIENTE;
    }

    const rechazado = error instanceof MensajeriaProveedorRechazoError;
    const estado = rechazado ? EstadoEnvio.FALLIDO : EstadoEnvio.SIN_CONFIRMAR;
    await this.campanias.registrarResultado(envioId, {
      estado,
      motivo: rechazado
        ? MotivoEnvio.RECHAZADO_POR_PROVEEDOR
        : MotivoEnvio.ENVIO_SIN_CONFIRMAR,
      detalle: rechazado ? error.message : null,
    });
    return estado;
  }
}
