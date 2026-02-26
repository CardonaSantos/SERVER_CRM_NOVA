// src/usuarios/presentation/user.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Put,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { UserService } from '../app/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/updateProfile';
import { UpdateOneUserDto } from '../dto/update-one-user.dto';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
// import { JwtAuthGuard } from 'src/auth/JwtGuard/JwtAuthGuard';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(private readonly userService: UserService) {}

  // ========= CREATE =========
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ========= LISTA GENERAL =========
  @Get()
  // @UseGuards(JwtAuthGuard)
  findAll(@GetUserAuthToken() userAuth: UserTokenAuth) {
    // userAuth lo sigue recibiendo el service por si luego quieres filtrar por empresa, rol, etc.
    return this.userService.findAll(userAuth);
  }

  // ========= ENDPOINT LEGACY (si lo usas en algún lado) =========
  @Get('/get-usuarios')
  getUsuario() {
    return this.userService.getUsuario();
  }

  // ========= INFO PERFIL POR ID =========
  @Get('/user-profile-info/:id')
  // @UseGuards(JwtAuthGuard)
  findUserInfo(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findUserInfo(id);
  }

  // ========= LISTA PARA CONFIGURAR PERFILES =========
  @Get('/get-user-profile-config')
  getUsersConfig() {
    return this.userService.getUsersToProfileConfig();
  }

  // ========= USERS PARA CREAR TICKETS =========
  @Get('/get-users-to-create-tickets')
  getUsersToCreateTickets() {
    return this.userService.getUsersToCreateTickets();
  }

  // ========= USERS PARA RUTAS (DTO especial) =========
  @Get('/get-users-to-rutas')
  getUserToRuta() {
    return this.userService.getUserByRole();
  }

  // ========= TÉCNICOS PARA TICKETS =========
  @Get('/get-tecnicos-to-ticket')
  getTecnicosToTicket() {
    return this.userService.getTecnicosToTicket();
  }

  // ========= USERS PARA METAS DE SOPORTE =========
  @Get('/get-users-to-meta-support')
  getUsersToMeta() {
    return this.userService.getUsersToMeta();
  }

  // ========= UPDATE PERFIL (usuario normal) =========
  @Put('user-profile/:id')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: false,
      whitelist: true,
    }),
  )
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'portada', maxCount: 1 },
    ]),
  )
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFiles()
    files: { avatar?: Express.Multer.File[]; portada?: Express.Multer.File[] },
  ) {
    const avatarFile = files?.avatar?.[0];
    const portadaFile = files?.portada?.[0];
    this.logger.log(
      `DTO de actualizacion: \n${JSON.stringify(updateUserDto, null, 2)}`,
    );
    return this.userService.updateUser(
      id,
      updateUserDto,
      avatarFile,
      portadaFile,
    );
  }

  // ========= UPDATE PERFIL (admin / otro usuario) =========
  @Put('/update-user-profile/:id')
  updateOneUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateOneUserDto,
  ) {
    // UpdateOneUserDto debería ser compatible con lo que espera updateOneUser (UpdateUserDto | AdminUpdateUserDto)
    return this.userService.updateOneUser(id, updateUserDto as any);
  }

  // ========= DELETE PERFIL =========
  @Delete('/user-profile/:id')
  async deleteUserProfile(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.userService.deleteUser(id);
  }
}
