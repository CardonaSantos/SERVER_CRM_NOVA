import { Injectable } from '@nestjs/common';
import { CreatePppoeCredentialDto } from './dto/create-pppoe-credential.dto';
import { UpdatePppoeCredentialDto } from './dto/update-pppoe-credential.dto';

@Injectable()
export class PppoeCredentialsService {
  create(createPppoeCredentialDto: CreatePppoeCredentialDto) {
    return 'This action adds a new pppoeCredential';
  }

  findAll() {
    return `This action returns all pppoeCredentials`;
  }

  findOne(id: number) {
    return `This action returns a #${id} pppoeCredential`;
  }

  update(id: number, updatePppoeCredentialDto: UpdatePppoeCredentialDto) {
    return `This action updates a #${id} pppoeCredential`;
  }

  remove(id: number) {
    return `This action removes a #${id} pppoeCredential`;
  }
}
