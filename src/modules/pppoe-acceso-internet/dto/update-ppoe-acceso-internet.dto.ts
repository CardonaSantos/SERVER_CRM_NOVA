import { PartialType } from '@nestjs/swagger';
import { CreatePpoeAccesoInternetDto } from './create-ppoe-acceso-internet.dto';

export class UpdatePpoeAccesoInternetDto extends PartialType(CreatePpoeAccesoInternetDto) {}
