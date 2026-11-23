import { PartialType } from '@nestjs/swagger';
import { CreatePerfilUsuarioDto } from './create-perfil-usuario.dto';

export class UpdatePerfilUsuarioDto extends PartialType(CreatePerfilUsuarioDto) {}
