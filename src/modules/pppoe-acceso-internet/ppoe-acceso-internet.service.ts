import { Injectable } from '@nestjs/common';
import { CreatePpoeAccesoInternetDto } from './dto/create-ppoe-acceso-internet.dto';
import { UpdatePpoeAccesoInternetDto } from './dto/update-ppoe-acceso-internet.dto';

@Injectable()
export class PpoeAccesoInternetService {
  create(createPpoeAccesoInternetDto: CreatePpoeAccesoInternetDto) {
    return 'This action adds a new ppoeAccesoInternet';
  }

  findAll() {
    return `This action returns all ppoeAccesoInternet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ppoeAccesoInternet`;
  }

  update(id: number, updatePpoeAccesoInternetDto: UpdatePpoeAccesoInternetDto) {
    return `This action updates a #${id} ppoeAccesoInternet`;
  }

  remove(id: number) {
    return `This action removes a #${id} ppoeAccesoInternet`;
  }
}
