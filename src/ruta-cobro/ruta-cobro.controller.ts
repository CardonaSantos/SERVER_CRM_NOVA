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
import { RutaCobroService } from './ruta-cobro.service';
import { CreateRutaDto } from './dto/create-ruta-cobro.dto';
import { UpdateRutaDto } from './dto/update-ruta-cobro.dto';
import { CreateNewRutaDto } from './dto/create-new-ruta.dto';

@Controller('ruta-cobro')
export class RutaCobroController {
  constructor(private readonly rutaCobroService: RutaCobroService) {}

  @Post()
  create(@Body() createRutaCobroDto: CreateNewRutaDto) {
    return this.rutaCobroService.create(createRutaCobroDto);
  }

  @Get()
  findAll() {
    return this.rutaCobroService.findAll();
  }

  @Get('/get-one-ruta-cobro/:rutaId')
  finRutaCobro(@Param('rutaId', ParseIntPipe) rutaId: number) {
    console.log('Visitando la ruta');

    return this.rutaCobroService.finRutaCobro(rutaId);
  }

  @Get('/get-rutas-cobros')
  findAllRutas() {
    return this.rutaCobroService.findAllRutas();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRutaCobroDto: UpdateRutaDto) {
    return this.rutaCobroService.update(+id, updateRutaCobroDto);
  }
  @Delete('/delete-all')
  removeAll() {
    return this.rutaCobroService.removeAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rutaCobroService.remove(+id);
  }
}
