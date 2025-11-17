import { PartialType } from '@nestjs/mapped-types';
import { CreatePerfilUsuarioDto } from './create-perfil-usuario.dto';

export class UpdatePerfilUsuarioDto extends PartialType(CreatePerfilUsuarioDto) {}
