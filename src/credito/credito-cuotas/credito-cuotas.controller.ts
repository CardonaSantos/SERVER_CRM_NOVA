import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreditoCuotasService } from './credito-cuotas.service';
import { CreateCreditoCuotaDto } from './dto/create-credito-cuota.dto';
import { UpdateCreditoCuotaDto } from './dto/update-credito-cuota.dto';

@Controller('credito-cuotas')
export class CreditoCuotasController {
  constructor(private readonly creditoCuotasService: CreditoCuotasService) {}

  @Post()
  create(@Body() createCreditoCuotaDto: CreateCreditoCuotaDto) {
    return this.creditoCuotasService.create(createCreditoCuotaDto);
  }

  @Get()
  findAll() {
    return this.creditoCuotasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditoCuotasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditoCuotaDto: UpdateCreditoCuotaDto) {
    return this.creditoCuotasService.update(+id, updateCreditoCuotaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditoCuotasService.remove(+id);
  }
}
