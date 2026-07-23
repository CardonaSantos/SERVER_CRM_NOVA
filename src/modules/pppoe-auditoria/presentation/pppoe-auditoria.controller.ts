import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PppoeAuditoriaService } from '../application/services/pppoe-auditoria.service';
import { CreatePppoeAuditoriaDto } from '../application/dto/create-pppoe-auditoria.dto';
import { UpdatePppoeAuditoriaDto } from '../application/dto/update-pppoe-auditoria.dto';

@Controller('pppoe-auditoria')
export class PppoeAuditoriaController {
  constructor(private readonly pppoeAuditoriaService: PppoeAuditoriaService) {}

  @Post()
  create(@Body() createPppoeAuditoriaDto: CreatePppoeAuditoriaDto) {
    return this.pppoeAuditoriaService.create(createPppoeAuditoriaDto);
  }

  @Get()
  findAll() {
    return this.pppoeAuditoriaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pppoeAuditoriaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePppoeAuditoriaDto: UpdatePppoeAuditoriaDto,
  ) {
    return this.pppoeAuditoriaService.update(+id, updatePppoeAuditoriaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pppoeAuditoriaService.remove(+id);
  }
}
