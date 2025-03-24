import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TipoServicioService } from './tipo-servicio.service';
import { CreateTipoServicioDto } from './dto/create-tipo-servicio.dto';
import { UpdateTipoServicioDto } from './dto/update-tipo-servicio.dto';

@Controller('tipo-servicio')
export class TipoServicioController {
  constructor(private readonly tipoServicioService: TipoServicioService) {}

  @Post()
  create(@Body() createTipoServicioDto: CreateTipoServicioDto) {
    return this.tipoServicioService.create(createTipoServicioDto);
  }

  @Get()
  findAll() {
    return this.tipoServicioService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tipoServicioService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTipoServicioDto: UpdateTipoServicioDto) {
    return this.tipoServicioService.update(+id, updateTipoServicioDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tipoServicioService.remove(+id);
  }
}
