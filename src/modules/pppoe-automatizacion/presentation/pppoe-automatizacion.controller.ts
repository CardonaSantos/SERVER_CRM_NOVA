import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PppoeAutomatizacionService } from '../application/services/pppoe-automatizacion.service';
import { CreatePppoeAutomatizacionDto } from '../application/dto/create-pppoe-automatizacion.dto';
import { UpdatePppoeAutomatizacionDto } from '../application/dto/update-pppoe-automatizacion.dto';

@Controller('pppoe-automatizacion')
export class PppoeAutomatizacionController {
  constructor(
    private readonly pppoeAutomatizacionService: PppoeAutomatizacionService,
  ) {}

  @Post()
  create(@Body() createPppoeAutomatizacionDto: CreatePppoeAutomatizacionDto) {
    return this.pppoeAutomatizacionService.create(createPppoeAutomatizacionDto);
  }

  @Get()
  findAll() {
    return this.pppoeAutomatizacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pppoeAutomatizacionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePppoeAutomatizacionDto: UpdatePppoeAutomatizacionDto,
  ) {
    return this.pppoeAutomatizacionService.update(
      +id,
      updatePppoeAutomatizacionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pppoeAutomatizacionService.remove(+id);
  }
}
