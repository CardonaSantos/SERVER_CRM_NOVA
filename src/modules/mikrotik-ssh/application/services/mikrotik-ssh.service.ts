import { Injectable } from '@nestjs/common';
import { CreateMikrotikSshDto } from '../dto/create-mikrotik-ssh.dto';
import { UpdateMikrotikSshDto } from '../dto/update-mikrotik-ssh.dto';

@Injectable()
export class MikrotikSshService {
  create(createMikrotikSshDto: CreateMikrotikSshDto) {
    return 'This action adds a new mikrotikSsh';
  }

  findAll() {
    return `This action returns all mikrotikSsh`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mikrotikSsh`;
  }

  update(id: number, updateMikrotikSshDto: UpdateMikrotikSshDto) {
    return `This action updates a #${id} mikrotikSsh`;
  }

  remove(id: number) {
    return `This action removes a #${id} mikrotikSsh`;
  }
}
