import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CreditoCronService } from './credito-cron.service';
import { CreateCreditoCronDto } from './dto/create-credito-cron.dto';
import { UpdateCreditoCronDto } from './dto/update-credito-cron.dto';

@Controller('credito-cron')
export class CreditoCronController {
  constructor(private readonly creditoCronService: CreditoCronService) {}

  @Post()
  create(@Body() createCreditoCronDto: CreateCreditoCronDto) {
    return this.creditoCronService.create(createCreditoCronDto);
  }

  @Get()
  findAll() {
    return this.creditoCronService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.creditoCronService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCreditoCronDto: UpdateCreditoCronDto) {
    return this.creditoCronService.update(+id, updateCreditoCronDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.creditoCronService.remove(+id);
  }
}
