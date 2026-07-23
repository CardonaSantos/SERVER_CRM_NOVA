import { PartialType } from '@nestjs/mapped-types';
import { CreatePppoeCredentialDto } from './create-pppoe-credential.dto';

export class UpdatePppoeCredentialDto extends PartialType(CreatePppoeCredentialDto) {}
