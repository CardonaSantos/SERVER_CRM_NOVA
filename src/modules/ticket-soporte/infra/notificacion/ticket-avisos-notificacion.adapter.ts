import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ROLES_OFICINA } from 'src/auth/roles/grupos-roles';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  DestinoTiempoReal,
  TIEMPO_REAL,
  TiempoRealPort,
} from 'src/common/tiempo-real/tiempo-real.port';
import {
  MENSAJERIA_CLIENTE,
  MensajeriaClienteFacadePort,
} from 'src/modules/mensajeria-cliente/public/mensajeria-cliente.facade.port';
import { NotificacionesService } from 'src/notificaciones/app/notificaciones.service';
import { FirebasePushService } from 'src/push-notifications/infra/firebase-push.service';
import {
  AvisoAsignacion,
  AvisoClienteTicketCreado,
  TicketAvisosPort,
  TicketParaAviso,
} from '../../application/ports/ticket-avisos.port';

/** Seis horas: una asignación vieja no debe aparecer días después. */
const VIGENCIA_PUSH_MS = 6 * 60 * 60 * 1000;

type Cambio = 'ASSIGNED' | 'UNASSIGNED';

/** Solo a los usuarios que entran o salen del ticket. */
export const EVENTO_TICKET_ASIGNACION_CAMBIADA =
  'ticket-soporte:asignacion-cambiada';
/** A la oficina: el panel vuelve a pedir el ticket. */
export const EVENTO_TICKET_ESTADO_CAMBIADO = 'ticket-soporte:estado-cambiado';

/**
 * Tiempo real por `TIEMPO_REAL`; push y notificaciones siguen sobre los
 * servicios legacy (se reemplazan en el módulo `notificacion`). Los datos del
 * push son los que ya escucha la app. Ningún método lanza.
 */
@Injectable()
export class TicketAvisosNotificacionAdapter implements TicketAvisosPort {
  private readonly logger = new Logger(TicketAvisosNotificacionAdapter.name);

  constructor(
    @Inject(TIEMPO_REAL) private readonly tiempoReal: TiempoRealPort,
    private readonly push: FirebasePushService,
    private readonly notificaciones: NotificacionesService,
    @Inject(MENSAJERIA_CLIENTE)
    private readonly mensajeria: MensajeriaClienteFacadePort,
    private readonly config: ConfigService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async asignacion(aviso: AvisoAsignacion): Promise<void> {
    const { ticket, motivo } = aviso;
    const grupos: Array<[Cambio, number[]]> = [
      ['ASSIGNED', aviso.agregados],
      ['UNASSIGNED', aviso.retirados],
    ];

    if (!grupos.some(([, usuarios]) => usuarios.length)) return;

    const ocurridoEn = this.reloj.ahora().toISOString();

    await this.sinLanzar(
      `asignación del ticket ${ticket.id}`,
      grupos.flatMap(([cambio, usuarios]) => [
        () =>
          this.emitir(
            EVENTO_TICKET_ASIGNACION_CAMBIADA,
            {
              ticketId: ticket.id,
              cambio: cambio === 'ASSIGNED' ? 'ASIGNADO' : 'RETIRADO',
              motivo: motivo === 'CREATED' ? 'CREACION' : 'REASIGNACION',
              titulo: ticket.titulo,
              estado: ticket.estado,
              prioridad: ticket.prioridad,
              ocurridoEn,
            },
            { usuarioIds: usuarios },
          ),
        ...usuarios.map(
          (usuarioId) => () => this.enviarPush(usuarioId, cambio, aviso),
        ),
      ]),
    );
  }

  async cambioEstado(
    ticket: TicketParaAviso,
    nombreTecnico: string | null,
  ): Promise<void> {
    await this.sinLanzar(`estado del ticket ${ticket.id}`, [
      () =>
        this.emitir(
          EVENTO_TICKET_ESTADO_CAMBIADO,
          {
            ticketId: ticket.id,
            estado: ticket.estado,
            titulo: ticket.titulo,
            tecnico: nombreTecnico,
          },
          { roles: ROLES_OFICINA },
        ),
    ]);
  }

  async clienteTicketCreado(aviso: AvisoClienteTicketCreado): Promise<void> {
    await this.sinLanzar(
      `WhatsApp del ticket ${aviso.ticketId}`,
      this.mensajeria.normalizarTelefonos(aviso.telefonos).map(
        (telefono) => () =>
          this.mensajeria.enviarPlantilla({
            telefono,
            plantilla: this.config.get<string>('TICKET_PLANTILLA_SID')!,
            variables: [
              aviso.nombreCliente || 'Estimado Cliente',
              aviso.titulo ?? 'N/A',
              `${aviso.ticketId}`,
              'N/A',
            ],
          }),
      ),
    );
  }

  async ticketDelBot(ticket: {
    id: number;
    titulo: string | null;
    descripcion: string | null;
  }): Promise<void> {
    await this.sinLanzar(`notificación del ticket ${ticket.id}`, [
      () =>
        this.notificaciones.create({
          titulo: `Nuevo ticket: ${ticket.titulo ?? ticket.id}`,
          mensaje: `Se ha generado un nuevo ticket: #${ticket.id} - ${ticket.descripcion ?? 'N/A'}`,
          audiencia: 'EMPRESA',
          severidad: 'INFO',
          categoria: 'BOT',
        }),
    ]);
  }

  private enviarPush(
    usuarioId: number,
    cambio: Cambio,
    { ticket, motivo }: AvisoAsignacion,
  ) {
    const asignado = cambio === 'ASSIGNED';

    return this.push.sendToUser({
      usuarioId,
      title: asignado
        ? 'Nuevo ticket asignado'
        : 'Asignación de ticket retirada',
      body: asignado
        ? `Ticket #${ticket.id} · ${ticket.titulo ?? 'Sin título'}`
        : `El ticket #${ticket.id} ya no está asignado a ti.`,
      // Todos los datos de FCM deben ser texto.
      data: {
        type: 'ticket.assignment',
        ticketId: String(ticket.id),
        change: cambio,
        reason: motivo,
        status: ticket.estado,
        priority: ticket.prioridad,
      },
      channelId: 'tickets',
      collapseKey: `ticket-assignment-${ticket.id}`,
      ttlMs: VIGENCIA_PUSH_MS,
    });
  }

  private emitir(
    evento: string,
    datos: object,
    destino: DestinoTiempoReal,
  ): Promise<void> {
    this.tiempoReal.emitir(evento, datos, destino);
    return Promise.resolve();
  }

  /** Un aviso fallido se registra y no deshace el cambio del ticket. */
  private async sinLanzar(
    asunto: string,
    envios: Array<() => Promise<unknown>>,
  ): Promise<void> {
    const resultados = await Promise.allSettled(
      envios.map(async (envio) => envio()),
    );
    const fallidos = resultados.filter((r) => r.status === 'rejected').length;

    if (fallidos) {
      this.logger.warn(`Fallaron ${fallidos} avisos de ${asunto}.`);
    }
  }
}
