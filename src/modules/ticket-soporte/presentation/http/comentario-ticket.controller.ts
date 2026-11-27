import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import {
  perteneceA,
  ROLES_OFICINA,
  ROLES_TECNICO,
} from 'src/auth/roles/grupos-roles';
import { ComentarTicketUseCase } from '../../application/use-cases/comentar-ticket.use-case';
import { EditarComentarioTicketUseCase } from '../../application/use-cases/editar-comentario-ticket.use-case';
import { EliminarComentarioTicketUseCase } from '../../application/use-cases/eliminar-comentario-ticket.use-case';
import { QuitarImagenComentarioTicketUseCase } from '../../application/use-cases/quitar-imagen-comentario-ticket.use-case';
import {
  MAXIMO_BYTES_IMAGEN,
  MAXIMO_IMAGENES,
} from '../../domain/policies/imagen-comentario.policy';
import { ComentarTicketDto } from '../dto/comentar-ticket.dto';
import { EditarComentarioTicketDto } from '../dto/editar-comentario-ticket.dto';

/** Un técnico solo comenta en los tickets que tiene asignados. */
const alcance = (actor: ActorHttp) =>
  perteneceA(ROLES_TECNICO, actor.rol) ? actor.usuarioId : undefined;

@ApiTags('ticket-soporte')
@Controller('ticket-soporte/:ticketId/comentarios')
export class ComentarioTicketController {
  constructor(
    private readonly comentarTicket: ComentarTicketUseCase,
    private readonly eliminarComentario: EliminarComentarioTicketUseCase,
    private readonly editarComentario: EditarComentarioTicketUseCase,
    private readonly quitarImagenComentario: QuitarImagenComentarioTicketUseCase,
  ) {}

  @Post()
  // El transporte deja margen sobre los límites reales para que el rechazo lo dé
  // la regla de negocio, con un mensaje que el usuario entiende.
  @UseInterceptors(
    FilesInterceptor('imagenes', MAXIMO_IMAGENES * 2, {
      limits: { fileSize: MAXIMO_BYTES_IMAGEN + 2 * 1024 * 1024 },
    }),
  )
  comentar(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @UploadedFiles() archivos: Express.Multer.File[] | undefined,
    @Body() dto: ComentarTicketDto,
    @Actor() actor: ActorHttp,
  ) {
    return this.comentarTicket.execute({
      ticketId,
      usuarioId: actor.usuarioId,
      empresaId: actor.empresaId,
      soloAsignadosA: alcance(actor),
      texto: dto.texto,
      imagenes: (archivos ?? []).map((archivo) => ({
        bytes: archivo.buffer,
        nombreArchivo: archivo.originalname || 'imagen',
      })),
    });
  }

  /** Solo el autor cambia el texto de su comentario. */
  @Patch(':comentarioId')
  editar(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('comentarioId', ParseIntPipe) comentarioId: number,
    @Body() dto: EditarComentarioTicketDto,
    @Actor() actor: ActorHttp,
  ) {
    return this.editarComentario.execute({
      ticketId,
      comentarioId,
      usuarioId: actor.usuarioId,
      soloAsignadosA: alcance(actor),
      texto: dto.texto,
    });
  }

  /** Quita una imagen: el autor las suyas y la oficina cualquiera. */
  @Delete(':comentarioId/imagenes/:imagenId')
  quitarImagen(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('comentarioId', ParseIntPipe) comentarioId: number,
    @Param('imagenId', ParseIntPipe) imagenId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.quitarImagenComentario.execute({
      ticketId,
      comentarioId,
      imagenId,
      usuarioId: actor.usuarioId,
      gestiona: perteneceA(ROLES_OFICINA, actor.rol),
      soloAsignadosA: alcance(actor),
    });
  }

  /** Borrado lógico: el autor borra los suyos y la oficina cualquiera. */
  @Delete(':comentarioId')
  eliminar(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Param('comentarioId', ParseIntPipe) comentarioId: number,
    @Actor() actor: ActorHttp,
  ) {
    return this.eliminarComentario.execute({
      ticketId,
      comentarioId,
      usuarioId: actor.usuarioId,
      gestiona: perteneceA(ROLES_OFICINA, actor.rol),
      soloAsignadosA: alcance(actor),
    });
  }
}
