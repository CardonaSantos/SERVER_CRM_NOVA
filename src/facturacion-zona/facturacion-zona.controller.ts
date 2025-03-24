import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FacturacionZonaService } from './facturacion-zona.service';
import { CreateFacturacionZonaDto } from './dto/create-facturacion-zona.dto';
import { UpdateFacturacionZonaDto } from './dto/update-facturacion-zona.dto';

@Controller('facturacion-zona')
export class FacturacionZonaController {
  constructor(
    private readonly facturacionZonaService: FacturacionZonaService,
  ) {}

  @Post()
  create(@Body() createFacturacionZonaDto: CreateFacturacionZonaDto) {
    return this.facturacionZonaService.create(createFacturacionZonaDto);
  }

  @Get()
  findAll() {
    return this.facturacionZonaService.findAll();
  }

  @Get('/get-zonas-facturacion-to-customer')
  findAllFacturacionZona() {
    return this.facturacionZonaService.findAllFacturacionZona();
  }

  @Get('/get-zonas-facturacion-to-ruta')
  findZonasFacturacionToRuta() {
    return this.facturacionZonaService.findZonasFacturacionToRuta();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturacionZonaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFacturacionZonaDto: UpdateFacturacionZonaDto,
  ) {
    return this.facturacionZonaService.update(+id, updateFacturacionZonaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.facturacionZonaService.remove(+id);
  }
}
