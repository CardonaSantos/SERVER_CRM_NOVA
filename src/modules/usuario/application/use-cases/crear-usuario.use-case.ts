import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  UNIDAD_DE_TRABAJO,
  UnidadDeTrabajoPort,
} from 'src/common/transaccion/unidad-de-trabajo.port';
import { UsuarioEntity } from '../../domain/entities/usuario.entity';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';
import { UsuarioCorreoDuplicadoError } from '../../domain/errors/usuario.errors';
import { normalizarCorreo } from '../../domain/policies/datos-usuario.policy';
import {
  USUARIO_REPOSITORY,
  UsuarioRepositoryPort,
} from '../../domain/ports/usuario-repository.port';
import {
  HASH_CONTRASENA,
  HashContrasenaPort,
} from '../ports/hash-contrasena.port';

export type CrearUsuarioInput = {
  actorId: number;
  /** De la sesión: una empresa por base de datos. */
  empresaId: number;
  nombre: string;
  correo: string;
  telefono?: string | null;
  rol: RolUsuario;
  contrasena: string;
};

@Injectable()
export class CrearUsuarioUseCase {
  private readonly logger = new Logger(CrearUsuarioUseCase.name);

  constructor(
    @Inject(USUARIO_REPOSITORY)
    private readonly usuarios: UsuarioRepositoryPort,
    @Inject(HASH_CONTRASENA) private readonly hash: HashContrasenaPort,
    @Inject(UNIDAD_DE_TRABAJO) private readonly unidad: UnidadDeTrabajoPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(input: CrearUsuarioInput): Promise<UsuarioEntity> {
    // Antes de codificar la contraseña (es lento): un correo repetido sale rápido.
    if (await this.usuarios.findByCorreo(normalizarCorreo(input.correo))) {
      throw new UsuarioCorreoDuplicadoError();
    }
    const contrasenaHash = await this.hash.hash(input.contrasena);

    const creado = await this.unidad.ejecutar(async () => {
      const usuario = UsuarioEntity.create(
        { ...input, contrasenaHash },
        this.reloj.ahora(),
      );
      if (await this.usuarios.findByCorreo(usuario.correo)) {
        throw new UsuarioCorreoDuplicadoError();
      }

      return this.usuarios.create(usuario);
    });

    this.logger.log(
      `Usuario ${creado.id} creado por el usuario ${input.actorId}.`,
    );
    return creado;
  }
}
