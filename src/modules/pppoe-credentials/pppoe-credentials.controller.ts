import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PppoeCredentialsService } from './pppoe-credentials.service';
import { CreatePppoeCredentialDto } from './dto/create-pppoe-credential.dto';
import { UpdatePppoeCredentialDto } from './dto/update-pppoe-credential.dto';

@Controller('pppoe-credentials')
export class PppoeCredentialsController {
  constructor(private readonly pppoeCredentialsService: PppoeCredentialsService) {}

  @Post()
  create(@Body() createPppoeCredentialDto: CreatePppoeCredentialDto) {
    return this.pppoeCredentialsService.create(createPppoeCredentialDto);
  }

  @Get()
  findAll() {
    return this.pppoeCredentialsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pppoeCredentialsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePppoeCredentialDto: UpdatePppoeCredentialDto) {
    return this.pppoeCredentialsService.update(+id, updatePppoeCredentialDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.pppoeCredentialsService.remove(+id);
  }
}
