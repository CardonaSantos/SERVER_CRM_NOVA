import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IdContratoService } from './id-contrato.service';
import { CreateIdContratoDto } from './dto/create-id-contrato.dto';
import { UpdateIdContratoDto } from './dto/update-id-contrato.dto';

@Controller('id-contrato')
export class IdContratoController {
  constructor(private readonly idContratoService: IdContratoService) {}

  @Post()
  create(@Body() createIdContratoDto: CreateIdContratoDto) {
    return this.idContratoService.create(createIdContratoDto);
  }

  @Get()
  findAll() {
    return this.idContratoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.idContratoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateIdContratoDto: UpdateIdContratoDto) {
    return this.idContratoService.update(+id, updateIdContratoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.idContratoService.remove(+id);
  }
}
