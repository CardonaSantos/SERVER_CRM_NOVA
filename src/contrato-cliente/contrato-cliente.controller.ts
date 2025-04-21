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
import { ContratoClienteService } from './contrato-cliente.service';
import { CreateContratoClienteDto } from './dto/create-contrato-cliente.dto';
import { UpdateContratoClienteDto } from './dto/update-contrato-cliente.dto';
import { CreatePlantillaContratoDto } from './dto/create-plantilla-contrato';
import { UpdatePlantillaContratoDto } from './dto/update-plantilla-contrato';

@Controller('contrato-cliente')
export class ContratoClienteController {
  constructor(private readonly contratoService: ContratoClienteService) {}

  @Post('por-cliente/:clienteId')
  async crearPorCliente(@Param('clienteId', ParseIntPipe) clienteId: number) {
    return this.contratoService.crearContratoPorCliente(clienteId);
  }

  @Post()
  async crearManual(@Body() dto: CreateContratoClienteDto) {
    return this.contratoService.crearContratoManual(dto);
  }

  @Get('/get-all-contratos')
  async getAllContratos() {
    return this.contratoService.getAllContratos();
  }

  @Get('/get-one-contrato/:contratoId/:plantillaId')
  async getOneContrato(
    @Param('contratoId', ParseIntPipe) contratoId: number,
    @Param('plantillaId', ParseIntPipe) plantillaId: number,
  ) {
    return this.contratoService.getOneContrato(contratoId, plantillaId);
  }

  @Patch()
  async editar(@Body() dto: UpdateContratoClienteDto) {
    return this.contratoService.editarContrato(dto);
  }

  @Delete(':id')
  async eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.contratoService.eliminarContrato(id);
  }

  //CONTROLADORES PARA LAS PLANTILLAS DE CONTRATO
  @Post('/plantilla')
  async crearPlantilla(@Body() dto: CreatePlantillaContratoDto) {
    return this.contratoService.crearPlantilla(dto);
  }

  @Get('/plantillas-contrato')
  async getPlantillas() {
    return this.contratoService.getPlantillas();
  }

  @Patch('/plantilla')
  async editarPlantilla(@Body() dto: UpdatePlantillaContratoDto) {
    return this.contratoService.editarPlantilla(dto);
  }

  @Delete('/plantilla/:id')
  async eliminarPlantilla(@Param('id', ParseIntPipe) id: number) {
    return this.contratoService.eliminarPlantilla(id);
  }
}
