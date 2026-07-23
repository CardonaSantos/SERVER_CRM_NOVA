import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PpoePerfilHomologacionService } from '../application/services/ppoe-perfil-homologacion.service';
import { CreatePpoePerfilHomologacionDto } from '../dto/create-ppoe-perfil-homologacion.dto';
import { UpdatePpoePerfilHomologacionDto } from '../dto/update-ppoe-perfil-homologacion.dto';

@Controller('ppoe-perfil-homologacion')
export class PpoePerfilHomologacionController {
  constructor(
    private readonly ppoePerfilHomologacionService: PpoePerfilHomologacionService,
  ) {}

  @Post()
  create(
    @Body() createPpoePerfilHomologacionDto: CreatePpoePerfilHomologacionDto,
  ) {
    return this.ppoePerfilHomologacionService.create(
      createPpoePerfilHomologacionDto,
    );
  }

  @Get()
  findAll() {
    return this.ppoePerfilHomologacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ppoePerfilHomologacionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePpoePerfilHomologacionDto: UpdatePpoePerfilHomologacionDto,
  ) {
    return this.ppoePerfilHomologacionService.update(
      +id,
      updatePpoePerfilHomologacionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ppoePerfilHomologacionService.remove(+id);
  }
}
