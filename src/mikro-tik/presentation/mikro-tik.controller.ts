import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import { MikroTikService } from '../application/mikro-tik.service';
import { CreateMikroTikDto } from '../dto/create-mikro-tik.dto';
import { UpdateMikroTikDto } from '../dto/update-mikro-tik.dto';
@Controller('mikro-tik')
export class MikroTikController {
  private readonly logger = new Logger(MikroTikController.name);
  constructor(private readonly mikroTikService: MikroTikService) {}

  // POST
  @Post()
  async create(@Body() dto: CreateMikroTikDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);

    return this.mikroTikService.create(dto);
  }

  // GET
  @Get('')
  async getAll() {
    return this.mikroTikService.getAll();
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.mikroTikService.getById(id);
  }

  // DELETE
  @Delete()
  async deleteAll() {
    return this.mikroTikService.deleteAll();
  }

  @Delete(':id')
  async deleteById(@Param('id', ParseIntPipe) id: number) {
    return this.mikroTikService.deleteById(id);
  }

  @Patch()
  async update(@Body() dto: CreateMikroTikDto) {
    this.logger.log(`DTO recibido:\n${JSON.stringify(dto, null, 2)}`);
    return this.mikroTikService.update(dto);
  }
}
