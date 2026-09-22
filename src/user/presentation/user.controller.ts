import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { GetUserAuthToken } from 'src/CustomDecoratorAuthToken/GetUserAuthToken';
import { UserTokenAuth } from 'src/auth/dto/userToken.dto';
import { UserService } from '../app/user.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateOneUserDto } from '../dto/update-one-user.dto';
import { UpdateUserDto } from '../dto/updateProfile';

@Controller('user')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: false,
  }),
)
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Get()
  findAll(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.findAll(userAuth);
  }

  @Get('/deleted')
  findDeleted(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.findDeleted(userAuth);
  }

  @Get('/get-usuarios')
  getUsuario() {
    return this.userService.getUsuario();
  }

  @Get('/user-profile-info/:id')
  findUserInfo(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findUserInfo(id);
  }

  @Get('/get-user-profile-config')
  getUsersConfig(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUsersToProfileConfig(userAuth);
  }

  @Get('/get-users-to-create-tickets')
  getUsersToCreateTickets(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUsersToCreateTickets(userAuth);
  }

  @Get('/get-users-to-rutas')
  getUserToRuta(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUserByRole(userAuth);
  }

  @Get('/get-tecnicos-to-ticket')
  getTecnicosToTicket(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getTecnicosToTicket(userAuth);
  }

  @Get('/get-users-to-meta-support')
  getUsersToMeta(@GetUserAuthToken() userAuth?: UserTokenAuth) {
    return this.userService.getUsersToMeta(userAuth);
  }

  @Put('user-profile/:id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'portada', maxCount: 1 },
    ]),
  )
  async updateUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @UploadedFiles()
    files: { avatar?: Express.Multer.File[]; portada?: Express.Multer.File[] },
  ) {
    const avatar = files?.avatar?.[0];
    const portada = files?.portada?.[0];

    this.logger.debug(`Actualización de perfil para usuario ${id}`);
    return this.userService.updateUser(id, dto, avatar, portada);
  }

  @Put('/update-user-profile/:id')
  updateOneUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOneUserDto,
  ) {
    return this.userService.updateOneUser(id, dto);
  }

  @Patch('/user-profile/:id/activate')
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.activateUser(id);
  }

  @Patch('/user-profile/:id/deactivate')
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.deactivateUser(id);
  }

  @Patch('/user-profile/:id/restore')
  restoreUser(@Param('id', ParseIntPipe) id: number) {
    return this.userService.restoreUser(id);
  }

  //   @Patch('/user-profile/:id/deactivate')
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deactivateUserProfile(
  //   @Param('id', ParseIntPipe) id: number,
  // ): Promise<void> {
  //   await this.userService.deactivateUser(id);
  // }

  @Delete('/user-profile/:id')
  async deleteUserProfile(
    @Param('id', ParseIntPipe) id: number,
    @GetUserAuthToken() userAuth?: UserTokenAuth,
  ): Promise<void> {
    const actorId = this.getActorId(userAuth);
    await this.userService.deleteUser(id, actorId);
  }

  private getActorId(userAuth?: UserTokenAuth): number | undefined {
    const value = (userAuth as unknown as { id?: unknown } | undefined)?.id;
    return typeof value === 'number' && Number.isInteger(value) && value > 0
      ? value
      : undefined;
  }
}
