import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/JwtGuard/JwtAuthGuard';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard) // Protege la ruta con JWT
  findAll(@GetUserAuthToken() userAuth) {
    console.log('Usuario autenticado:', userAuth);
    return this.userService.findAll(userAuth);
  }

  @Get('/get-users-to-create-tickets')
  getUsersToCreateTickets() {
    return this.userService.getUsersToCreateTickets();
  }

  @Get('/get-users-to-rutas')
  getUserToRuta() {
    return this.userService.getUserByRole();
  }

  @Get('/set-saldo-0/:id')
  setSaldo0(@Param('id') id: string) {
    return this.userService.setSaldo0(+id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    // return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.userService.remove(+id);
  }
}
