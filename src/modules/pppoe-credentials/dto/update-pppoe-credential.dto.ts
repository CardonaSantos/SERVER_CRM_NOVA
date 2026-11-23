import { PartialType } from '@nestjs/swagger';
import { CreatePppoeCredentialDto } from './create-pppoe-credential.dto';

export class UpdatePppoeCredentialDto extends PartialType(CreatePppoeCredentialDto) {}
