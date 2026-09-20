import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PppoeOperacionService } from '../application/services/pppoe-operacion.service';
import { CreatePppoeOperacionDto } from '../application/dto/create-pppoe-operacion.dto';
import { UpdatePppoeOperacionDto } from '../application/dto/update-pppoe-operacion.dto';

@Controller('pppoe-operacion')
export class PppoeOperacionController {
  constructor(private readonly pppoeOperacionService: PppoeOperacionService) {}

  @Post()
  create(@Body() createPppoeOperacionDto: CreatePppoeOperacionDto) {
    return this.pppoeOperacionService.create(createPppoeOperacionDto);
  }

  @Get()
  findAll() {
    return this.pppoeOperacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pppoeOperacionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePppoeOperacionDto: UpdatePppoeOperacionDto,
  ) {
    return this.pppoeOperacionService.update(+id, updatePppoeOperacionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pppoeOperacionService.remove(+id);
  }
}
