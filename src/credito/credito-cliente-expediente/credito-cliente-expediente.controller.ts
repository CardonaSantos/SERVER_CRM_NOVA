import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreditoClienteExpedienteService } from './credito-cliente-expediente.service';
import { CreateCreditoClienteExpedienteDto } from './dto/create-credito-cliente-expediente.dto';
import { UpdateCreditoClienteExpedienteDto } from './dto/update-credito-cliente-expediente.dto';

@Controller('credito-cliente-expediente')
export class CreditoClienteExpedienteController {
  constructor(private readonly creditoClienteExpedienteService: CreditoClienteExpedienteService) {}

  @Post()
  create(@Body() createCreditoClienteExpedienteDto: CreateCreditoClienteExpedienteDto) {
    return this.creditoClienteExpedienteService.create(createCreditoClienteExpedienteDto);
  }

  @Get()
  findAll() {
    return this.creditoClienteExpedienteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditoClienteExpedienteService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditoClienteExpedienteDto: UpdateCreditoClienteExpedienteDto) {
    return this.creditoClienteExpedienteService.update(+id, updateCreditoClienteExpedienteDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditoClienteExpedienteService.remove(+id);
  }
}
