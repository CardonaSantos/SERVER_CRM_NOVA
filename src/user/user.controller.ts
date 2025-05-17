import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/updateProfile';
// import { JwtAuthGuard } from 'src/auth/JwtGuard/JwtAuthGuard';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';
import { UpdateOneUserDto } from './dto/update-one-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  // @UseGuards(JwtAuthGuard) // Protege la ruta con JWT
  findAll(@GetUserAuthToken() userAuth) {
    console.log('Usuario autenticado:', userAuth);
    return this.userService.findAll(userAuth);
  }

  @Get('/user-profile-info/:id')
  // @UseGuards(JwtAuthGuard) // Protege la ruta con JWT
  findUserInfo(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findUserInfo(id);
  }

  @Get('/get-user-profile-config')
  getUsersConfig() {
    return this.userService.getUsersToProfileConfig();
  }

  @Get('/get-users-to-create-tickets')
  getUsersToCreateTickets() {
    return this.userService.getUsersToCreateTickets();
  }

  @Get('/get-users-to-rutas')
  getUserToRuta() {
    return this.userService.getUserByRole();
  }

  @Get('/get-tecnicos-to-ticket')
  getTecnicosToTicket() {
    return this.userService.getTecnicosToTicket();
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

  @Put('user-profile/:id')
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  @Put('/update-user-profile/:id')
  async updateOneUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateOneUserDto,
  ) {
    return this.userService.updateOneUser(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    // return this.userService.remove(+id);
  }

  @Delete('/user-profile/:id')
  async deleteUserProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.userService.deleteUser(id);
  }
}
