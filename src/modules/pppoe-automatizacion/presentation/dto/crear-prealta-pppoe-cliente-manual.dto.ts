import { IsInt, Min } from 'class-validator';

/**
 * Datos necesarios para preparar administrativamente
 * una cuenta PPPoE para un cliente existente.
 *
 * No se reciben desde el body:
 *
 * - empresaId;
 * - operadorId;
 * - operadorNombre;
 * - ipOrigen;
 * - userAgent.
 *
 * Ese contexto se obtiene exclusivamente del JWT
 * y de la petición HTTP autenticada.
 */
export class CrearPrealtaPppoeClienteManualDto {
  /**
   * Cliente al que se asignará el acceso PPPoE.
   */
  @IsInt()
  @Min(1)
  clienteId: number;

  /**
   * Servicio de internet que determina el plan
   * que deberá homologarse contra MikroTik.
   */
  @IsInt()
  @Min(1)
  servicioInternetId: number;

  /**
   * Router MikroTik seleccionado para resolver
   * la homologación PPPoE correspondiente.
   */
  @IsInt()
  @Min(1)
  mikrotikRouterId: number;
}
