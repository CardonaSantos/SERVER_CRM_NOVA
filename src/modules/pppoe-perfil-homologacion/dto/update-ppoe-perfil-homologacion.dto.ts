import { PartialType } from '@nestjs/mapped-types';
import { CreatePpoePerfilHomologacionDto } from './create-ppoe-perfil-homologacion.dto';

export class UpdatePpoePerfilHomologacionDto extends PartialType(CreatePpoePerfilHomologacionDto) {}
