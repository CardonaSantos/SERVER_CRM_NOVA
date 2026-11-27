import { Module } from '@nestjs/common';
import { PasswordService } from 'src/auth/password/password.service';
import { AlmacenamientoMediaModule } from 'src/modules/almacenamiento-media/almacenamiento-media.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsuarioFacade } from './application/facade/usuario.facade';
import { HASH_CONTRASENA } from './application/ports/hash-contrasena.port';
import { IMAGEN_PERFIL } from './application/ports/imagen-perfil.port';
import { REAUTENTICACION_USUARIO } from './application/ports/reautenticacion-usuario.port';
import { SESIONES_USUARIO } from './application/ports/sesiones-usuario.port';
import { MiPerfilService } from './application/services/mi-perfil.service';
import { ActivarUsuarioUseCase } from './application/use-cases/activar-usuario.use-case';
import { ActualizarMiPerfilUseCase } from './application/use-cases/actualizar-mi-perfil.use-case';
import { ActualizarUsuarioUseCase } from './application/use-cases/actualizar-usuario.use-case';
import { BuscarCredencialesUsuarioUseCase } from './application/use-cases/buscar-credenciales-usuario.use-case';
import { CambiarContrasenaUsuarioUseCase } from './application/use-cases/cambiar-contrasena-usuario.use-case';
import { CambiarImagenPerfilUseCase } from './application/use-cases/cambiar-imagen-perfil.use-case';
import { CambiarMiContrasenaUseCase } from './application/use-cases/cambiar-mi-contrasena.use-case';
import { CrearUsuarioUseCase } from './application/use-cases/crear-usuario.use-case';
import { DesactivarUsuarioUseCase } from './application/use-cases/desactivar-usuario.use-case';
import { EliminarUsuarioUseCase } from './application/use-cases/eliminar-usuario.use-case';
import { ListarOpcionesUsuarioUseCase } from './application/use-cases/listar-opciones-usuario.use-case';
import { ListarUsuariosUseCase } from './application/use-cases/listar-usuarios.use-case';
import { ObtenerMiPerfilUseCase } from './application/use-cases/obtener-mi-perfil.use-case';
import { ObtenerPerfilSesionUseCase } from './application/use-cases/obtener-perfil-sesion.use-case';
import { ObtenerUsuarioUseCase } from './application/use-cases/obtener-usuario.use-case';
import { QuitarImagenPerfilUseCase } from './application/use-cases/quitar-imagen-perfil.use-case';
import { RestaurarUsuarioUseCase } from './application/use-cases/restaurar-usuario.use-case';
import { VerificarContrasenaUsuarioUseCase } from './application/use-cases/verificar-contrasena-usuario.use-case';
import { PERFIL_USUARIO_REPOSITORY } from './domain/ports/perfil-usuario-repository.port';
import { USUARIO_QUERY } from './domain/ports/usuario-query.port';
import { USUARIO_REPOSITORY } from './domain/ports/usuario-repository.port';
import { ImagenPerfilAlmacenamientoAdapter } from './infra/almacenamiento/imagen-perfil-almacenamiento.adapter';
import { ReautenticacionStepUpAdapter } from './infra/auth/reautenticacion-step-up.adapter';
import { SesionesAuthAdapter } from './infra/auth/sesiones-auth.adapter';
import { PerfilUsuarioPrismaRepository } from './infra/prisma/perfil-usuario-prisma.repository';
import { UsuarioPrismaQuery } from './infra/prisma/usuario-prisma.query';
import { UsuarioPrismaRepository } from './infra/prisma/usuario-prisma.repository';
import { MiPerfilController } from './presentation/http/mi-perfil.controller';
import { UsuarioController } from './presentation/http/usuario.controller';
import { USUARIO } from './public/usuario.facade.port';

/**
 * Cuentas del CRM y el perfil de cada una. `auth` lo usa por la fachada
 * `USUARIO`; este módulo no importa `AuthModule` (sería un ciclo): usa los
 * servicios globales de contraseñas y sesiones.
 */
@Module({
  imports: [PrismaModule, AlmacenamientoMediaModule],
  // `MiPerfilController` primero: `/usuarios/yo` no debe caer en `/usuarios/:usuarioId`.
  controllers: [MiPerfilController, UsuarioController],
  providers: [
    // Casos de uso
    ListarUsuariosUseCase,
    ObtenerUsuarioUseCase,
    ListarOpcionesUsuarioUseCase,
    CrearUsuarioUseCase,
    ActualizarUsuarioUseCase,
    CambiarContrasenaUsuarioUseCase,
    ActivarUsuarioUseCase,
    DesactivarUsuarioUseCase,
    EliminarUsuarioUseCase,
    RestaurarUsuarioUseCase,
    ObtenerMiPerfilUseCase,
    ActualizarMiPerfilUseCase,
    CambiarMiContrasenaUseCase,
    CambiarImagenPerfilUseCase,
    QuitarImagenPerfilUseCase,
    BuscarCredencialesUsuarioUseCase,
    VerificarContrasenaUsuarioUseCase,
    ObtenerPerfilSesionUseCase,
    // Services
    MiPerfilService,
    // Fachada
    UsuarioFacade,
    { provide: USUARIO, useExisting: UsuarioFacade },
    // Adaptadores
    { provide: USUARIO_REPOSITORY, useClass: UsuarioPrismaRepository },
    { provide: USUARIO_QUERY, useClass: UsuarioPrismaQuery },
    {
      provide: PERFIL_USUARIO_REPOSITORY,
      useClass: PerfilUsuarioPrismaRepository,
    },
    { provide: HASH_CONTRASENA, useExisting: PasswordService },
    {
      provide: REAUTENTICACION_USUARIO,
      useClass: ReautenticacionStepUpAdapter,
    },
    { provide: SESIONES_USUARIO, useClass: SesionesAuthAdapter },
    { provide: IMAGEN_PERFIL, useClass: ImagenPerfilAlmacenamientoAdapter },
  ],
  exports: [USUARIO],
})
export class UsuarioModule {}
