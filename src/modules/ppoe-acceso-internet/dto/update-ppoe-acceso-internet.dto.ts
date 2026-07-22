import { PartialType } from '@nestjs/mapped-types';
import { CreatePpoeAccesoInternetDto } from './create-ppoe-acceso-internet.dto';

export class UpdatePpoeAccesoInternetDto extends PartialType(CreatePpoeAccesoInternetDto) {}
