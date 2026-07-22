// import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
// import { PpoeAccesoInternetService } from './ppoe-acceso-internet.service';
// import { CreatePpoeAccesoInternetDto } from './dto/create-ppoe-acceso-internet.dto';
// import { UpdatePpoeAccesoInternetDto } from './dto/update-ppoe-acceso-internet.dto';

// @Controller('ppoe-acceso-internet')
// export class PpoeAccesoInternetController {
//   constructor(private readonly ppoeAccesoInternetService: PpoeAccesoInternetService) {}

//   @Post()
//   create(@Body() createPpoeAccesoInternetDto: CreatePpoeAccesoInternetDto) {
//     return this.ppoeAccesoInternetService.create(createPpoeAccesoInternetDto);
//   }

//   @Get()
//   findAll() {
//     return this.ppoeAccesoInternetService.findAll();
//   }

//   @Get(':id')
//   findOne(@Param('id') id: string) {
//     return this.ppoeAccesoInternetService.findOne(+id);
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePpoeAccesoInternetDto: UpdatePpoeAccesoInternetDto) {
//     return this.ppoeAccesoInternetService.update(+id, updatePpoeAccesoInternetDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.ppoeAccesoInternetService.remove(+id);
//   }
// }
