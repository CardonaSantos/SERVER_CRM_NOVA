import type { TicketHistorialCambio } from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.types';
import { TicketProps } from '../props/ticket.props';

export type NombresDeReferencias = {
  usuarios: Map<number, string>;
  etiquetas: Map<number, string>;
  clientes: Map<number, string>;
};

/** Cambios de una edición, con nombres para que la bitácora se pueda leer. */
export function cambiosDelTicket(
  antes: TicketProps,
  despues: TicketProps,
  nombres: NombresDeReferencias,
): TicketHistorialCambio[] {
  const nombrar = (mapa: Map<number, string>, id: number | null) =>
    id === null ? null : (mapa.get(id) ?? `#${id}`);
  const lista = (mapa: Map<number, string>, ids: number[]) =>
    ids.map((id) => nombrar(mapa, id));

  const cambios: TicketHistorialCambio[] = [
    { campo: 'titulo', anterior: antes.titulo, nuevo: despues.titulo },
    {
      campo: 'descripcion',
      anterior: antes.descripcion,
      nuevo: despues.descripcion,
    },
    { campo: 'prioridad', anterior: antes.prioridad, nuevo: despues.prioridad },
    {
      campo: 'cliente',
      anterior: nombrar(nombres.clientes, antes.clienteId),
      nuevo: nombrar(nombres.clientes, despues.clienteId),
    },
    {
      campo: 'tecnicoPrincipal',
      anterior: nombrar(nombres.usuarios, antes.tecnicoId),
      nuevo: nombrar(nombres.usuarios, despues.tecnicoId),
    },
    {
      campo: 'tecnicosAdicionales',
      anterior: lista(nombres.usuarios, antes.apoyoIds),
      nuevo: lista(nombres.usuarios, despues.apoyoIds),
    },
    {
      campo: 'etiquetas',
      anterior: lista(nombres.etiquetas, antes.etiquetaIds),
      nuevo: lista(nombres.etiquetas, despues.etiquetaIds),
    },
    { campo: 'fijado', anterior: antes.fijado, nuevo: despues.fijado },
  ];

  return cambios;
}
