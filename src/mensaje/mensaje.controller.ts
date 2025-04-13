import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { MensajeService } from './mensaje.service';
import { CreatePlantillaMensajeDto } from './dto/create-mensaje.dto';
import { UpdatePlantillaMensajeDto } from './dto/update-mensaje.dto';
import { DeletePlantillaMensajeDto } from './dto/delete-mensaje.dto';

@Controller('mensaje')
export class MensajeController {
  constructor(private readonly mensajeService: MensajeService) {}

  @Post()
  async create(@Body() createPlantillaMensajeDto: CreatePlantillaMensajeDto) {
    return this.mensajeService.create(createPlantillaMensajeDto);
  }

  @Get('/get-mensajes-plantillas')
  async getMensajesPantillas() {
    return this.mensajeService.getMensajesPantillas();
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlantillaMensajeDto: UpdatePlantillaMensajeDto,
  ) {
    return this.mensajeService.update(id, updatePlantillaMensajeDto);
  }

  @Delete(':id')
  async remove(@Param() deletePlantillaMensajeDto: DeletePlantillaMensajeDto) {
    return this.mensajeService.delete(deletePlantillaMensajeDto);
  }
}
