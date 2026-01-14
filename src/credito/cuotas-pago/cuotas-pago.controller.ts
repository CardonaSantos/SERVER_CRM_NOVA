import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CuotasPagoService } from './cuotas-pago.service';
import { CreateCuotasPagoDto } from './dto/create-cuotas-pago.dto';
import { UpdateCuotasPagoDto } from './dto/update-cuotas-pago.dto';

@Controller('cuotas-pago')
export class CuotasPagoController {
  constructor(private readonly cuotasPagoService: CuotasPagoService) {}

  @Post()
  create(@Body() createCuotasPagoDto: CreateCuotasPagoDto) {
    return this.cuotasPagoService.create(createCuotasPagoDto);
  }

  @Get()
  findAll() {
    return this.cuotasPagoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cuotasPagoService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCuotasPagoDto: UpdateCuotasPagoDto) {
    return this.cuotasPagoService.update(+id, updateCuotasPagoDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cuotasPagoService.remove(+id);
  }
}
