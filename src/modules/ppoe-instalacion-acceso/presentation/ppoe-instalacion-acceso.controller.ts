import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PpoeInstalacionAccesoService } from '../ppoe-instalacion-acceso.service';
import { CreatePpoeInstalacionAccesoDto } from '../dto/create-ppoe-instalacion-acceso.dto';
import { UpdatePpoeInstalacionAccesoDto } from '../dto/update-ppoe-instalacion-acceso.dto';

@Controller('ppoe-instalacion-acceso')
export class PpoeInstalacionAccesoController {
  constructor(
    private readonly ppoeInstalacionAccesoService: PpoeInstalacionAccesoService,
  ) {}

  @Post()
  create(
    @Body() createPpoeInstalacionAccesoDto: CreatePpoeInstalacionAccesoDto,
  ) {
    return this.ppoeInstalacionAccesoService.create(
      createPpoeInstalacionAccesoDto,
    );
  }

  @Get()
  findAll() {
    return this.ppoeInstalacionAccesoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ppoeInstalacionAccesoService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePpoeInstalacionAccesoDto: UpdatePpoeInstalacionAccesoDto,
  ) {
    return this.ppoeInstalacionAccesoService.update(
      +id,
      updatePpoeInstalacionAccesoDto,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ppoeInstalacionAccesoService.remove(+id);
  }
}
