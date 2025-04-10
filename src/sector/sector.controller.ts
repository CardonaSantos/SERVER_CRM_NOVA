import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { SectorService } from './sector.service';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Controller('sector')
export class SectorController {
  constructor(private readonly sectorService: SectorService) {}

  @Post()
  async create(@Body() createSectorDto: CreateSectorDto) {
    return this.sectorService.create(createSectorDto);
  }

  @Get()
  async findAll() {
    return this.sectorService.findAll();
  }

  @Get('/sectores-to-select')
  async findAllSectoresToSelect() {
    return this.sectorService.findAllSectoresToSelect();
  }

  @Get('/get-municipios-to-sector')
  async getSectoresToEdit() {
    return this.sectorService.getSectoresToEdit();
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateSectorDto: UpdateSectorDto,
  ) {
    return this.sectorService.update(id, updateSectorDto);
  }

  @Patch('/update-sector/:id')
  async updateSector(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSectorDto: UpdateSectorDto,
  ) {
    return this.sectorService.updateSector(id, updateSectorDto);
  }

  @Delete('/:id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.sectorService.delete(id);
  }
}
