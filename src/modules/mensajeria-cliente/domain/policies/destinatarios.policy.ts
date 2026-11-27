import { EstadoEnvio, MotivoEnvio } from '../enums/campania.enum';
import { esTelefonoEntregable, normalizarTelefonos } from './telefono.policy';

export type ClienteDestinatario = {
  id: number;
  telefono: string | null;
  eliminado: boolean;
  whatsappActivo: boolean;
};

export type DestinoCampania = {
  clienteId: number;
  telefono: string | null;
  estado: EstadoEnvio.PENDIENTE | EstadoEnvio.OMITIDO;
  motivo: MotivoEnvio | null;
};

/**
 * Qué se le enviará a cada cliente. Un número recibe la campaña una sola vez,
 * aunque lo compartan varios clientes. Todo lo omitido queda con su motivo.
 */
export function resolverDestinos(
  clientes: ClienteDestinatario[],
): DestinoCampania[] {
  const usados = new Set<string>();

  return clientes.flatMap((cliente): DestinoCampania[] => {
    const omitir = (motivo: MotivoEnvio, telefono: string | null = null) => ({
      clienteId: cliente.id,
      telefono,
      estado: EstadoEnvio.OMITIDO as const,
      motivo,
    });

    if (cliente.eliminado) return [omitir(MotivoEnvio.CLIENTE_ELIMINADO)];
    if (!cliente.whatsappActivo) {
      return [omitir(MotivoEnvio.WHATSAPP_DESACTIVADO)];
    }

    const telefonos = [
      ...new Set(
        normalizarTelefonos([cliente.telefono]).filter(esTelefonoEntregable),
      ),
    ];
    if (telefonos.length === 0) {
      return [omitir(MotivoEnvio.SIN_TELEFONO_VALIDO)];
    }

    return telefonos.map((telefono) => {
      if (usados.has(telefono)) {
        return omitir(MotivoEnvio.TELEFONO_REPETIDO, telefono);
      }
      usados.add(telefono);
      return {
        clienteId: cliente.id,
        telefono,
        estado: EstadoEnvio.PENDIENTE,
        motivo: null,
      };
    });
  });
}
