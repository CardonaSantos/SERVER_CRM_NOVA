import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CreatePerfilDto } from '../dto/create-perfil.dto';
import { UpdatePerfilDto } from '../dto/update-perfil.dto';
import { PerfilService } from '../app/perfil.service';

@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}
}
