import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import { Actor, ActorHttp } from 'src/auth/decoradores/actor.decorator';
import { OperacionSensible } from 'src/auth/step-up/operacion-sensible.decorator';
import { ActualizarMiPerfilUseCase } from '../../application/use-cases/actualizar-mi-perfil.use-case';
import { CambiarImagenPerfilUseCase } from '../../application/use-cases/cambiar-imagen-perfil.use-case';
import { CambiarMiContrasenaUseCase } from '../../application/use-cases/cambiar-mi-contrasena.use-case';
import { ObtenerMiPerfilUseCase } from '../../application/use-cases/obtener-mi-perfil.use-case';
import { QuitarImagenPerfilUseCase } from '../../application/use-cases/quitar-imagen-perfil.use-case';
import { TipoImagenPerfil } from '../../domain/enums/tipo-imagen-perfil.enum';
import { MAXIMO_BYTES_IMAGEN_PERFIL } from '../../domain/policies/imagen-perfil.policy';
import { ActualizarMiPerfilDto } from '../dto/actualizar-mi-perfil.dto';
import { CambiarContrasenaUsuarioDto } from '../dto/cambiar-contrasena-usuario.dto';
import { UsuarioPresenter } from '../presenters/usuario.presenter';

const tipoImagen = new ParseEnumPipe(TipoImagenPerfil);

/** La cuenta de quien tiene sesión. Cualquier rol. */
@ApiTags('usuarios')
@Controller('usuarios/yo')
export class MiPerfilController {
  constructor(
    private readonly obtenerMiPerfil: ObtenerMiPerfilUseCase,
    private readonly actualizarMiPerfil: ActualizarMiPerfilUseCase,
    private readonly cambiarMiContrasena: CambiarMiContrasenaUseCase,
    private readonly cambiarImagen: CambiarImagenPerfilUseCase,
    private readonly quitarImagen: QuitarImagenPerfilUseCase,
  ) {}

  @Get()
  async obtener(@Actor() actor: ActorHttp) {
    return UsuarioPresenter.miPerfil(
      await this.obtenerMiPerfil.execute(actor.usuarioId),
    );
  }

  @Patch()
  async actualizar(
    @Body() dto: ActualizarMiPerfilDto,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.miPerfil(
      await this.actualizarMiPerfil.execute({
        usuarioId: actor.usuarioId,
        nombre: dto.nombre,
        telefono: dto.telefono,
        bio: dto.bio,
        notificarWhatsApp: dto.notificarWhatsApp,
        notificarPush: dto.notificarPush,
        notificarSonido: dto.notificarSonido,
      }),
    );
  }

  /** Pide la contraseña actual y cierra las demás sesiones. */
  @Patch('contrasena')
  @OperacionSensible()
  async contrasena(
    @Body() dto: CambiarContrasenaUsuarioDto,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.contrasenaCambiada(
      await this.cambiarMiContrasena.execute({
        usuarioId: actor.usuarioId,
        sesionId: actor.sesionId,
        contrasenaActual: dto.contrasenaActual,
        contrasenaNueva: dto.contrasenaNueva,
      }),
    );
  }

  /** Multipart con el campo `imagen`: JPG, PNG o WebP de hasta 5 MB. */
  @Put(':imagen')
  // El transporte deja margen para que el rechazo lo dé la regla, con su mensaje.
  @UseInterceptors(
    FileInterceptor('imagen', {
      limits: { fileSize: MAXIMO_BYTES_IMAGEN_PERFIL + 2 * 1024 * 1024 },
    }),
  )
  async ponerImagen(
    @Param('imagen', tipoImagen) tipo: TipoImagenPerfil,
    @UploadedFile() archivo: Express.Multer.File | undefined,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.miPerfil(
      await this.cambiarImagen.execute({
        usuarioId: actor.usuarioId,
        empresaId: actor.empresaId,
        tipo,
        bytes: archivo?.buffer,
      }),
    );
  }

  @Delete(':imagen')
  async borrarImagen(
    @Param('imagen', tipoImagen) tipo: TipoImagenPerfil,
    @Actor() actor: ActorHttp,
  ) {
    return UsuarioPresenter.miPerfil(
      await this.quitarImagen.execute({ usuarioId: actor.usuarioId, tipo }),
    );
  }
}
