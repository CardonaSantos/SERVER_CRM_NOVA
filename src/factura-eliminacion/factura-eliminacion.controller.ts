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
import { FacturaEliminacionService } from './factura-eliminacion.service';
import { CreateFacturaEliminacionDto } from './dto/create-factura-eliminacion.dto';
import { UpdateFacturaEliminacionDto } from './dto/update-factura-eliminacion.dto';

@Controller('factura-eliminacion')
export class FacturaEliminacionController {
  constructor(
    private readonly facturaEliminacionService: FacturaEliminacionService,
  ) {}

  @Post()
  create(@Body() createFacturaEliminacionDto: CreateFacturaEliminacionDto) {
    return this.facturaEliminacionService.create(createFacturaEliminacionDto);
  }

  @Get()
  findAll() {
    return this.facturaEliminacionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.facturaEliminacionService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateFacturaEliminacionDto: UpdateFacturaEliminacionDto,
  ) {
    return this.facturaEliminacionService.update(
      +id,
      updateFacturaEliminacionDto,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.facturaEliminacionService.remove(id);
  }
}
