import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PpoeClienteCuentaService } from '../application/services/ppoe-cliente-cuenta.service';
import { CreatePpoeClienteCuentaDto } from '../application/dto/create-ppoe-cliente-cuenta.dto';
import { UpdatePpoeClienteCuentaDto } from '../application/dto/update-ppoe-cliente-cuenta.dto';

@Controller('ppoe-cliente-cuenta')
export class PpoeClienteCuentaController {
  constructor(
    private readonly ppoeClienteCuentaService: PpoeClienteCuentaService,
  ) {}

  @Post()
  create(@Body() createPpoeClienteCuentaDto: CreatePpoeClienteCuentaDto) {
    return this.ppoeClienteCuentaService.create(createPpoeClienteCuentaDto);
  }

  @Get()
  findAll() {
    return this.ppoeClienteCuentaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ppoeClienteCuentaService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePpoeClienteCuentaDto: UpdatePpoeClienteCuentaDto,
  ) {
    return this.ppoeClienteCuentaService.update(
      +id,
      updatePpoeClienteCuentaDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ppoeClienteCuentaService.remove(+id);
  }
}
