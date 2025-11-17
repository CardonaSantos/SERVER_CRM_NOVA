import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PerfilUsuarioService } from './perfil-usuario.service';
import { CreatePerfilUsuarioDto } from './dto/create-perfil-usuario.dto';
import { UpdatePerfilUsuarioDto } from './dto/update-perfil-usuario.dto';

@Controller('perfil-usuario')
export class PerfilUsuarioController {
  constructor(private readonly perfilUsuarioService: PerfilUsuarioService) {}

  @Post()
  create(@Body() createPerfilUsuarioDto: CreatePerfilUsuarioDto) {
    return this.perfilUsuarioService.create(createPerfilUsuarioDto);
  }

  @Get()
  findAll() {
    return this.perfilUsuarioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.perfilUsuarioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePerfilUsuarioDto: UpdatePerfilUsuarioDto) {
    return this.perfilUsuarioService.update(+id, updatePerfilUsuarioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.perfilUsuarioService.remove(+id);
  }
}
