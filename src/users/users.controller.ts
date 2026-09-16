import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permission } from '../permissions/permissions';
import { RequirePermission } from '../permissions/require-permission.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { type UserRecord } from './user.types';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission(Permission.USER_LIST)
  list(@CurrentUser() actor: UserRecord) {
    return this.users.listInScope(actor);
  }

  @Get(':id')
  @RequirePermission(Permission.USER_READ)
  get(@CurrentUser() actor: UserRecord, @Param('id') id: string) {
    return this.users.getInScope(actor, id);
  }

  @Post()
  @RequirePermission(Permission.USER_CREATE)
  create(@CurrentUser() actor: UserRecord, @Body() dto: CreateUserDto) {
    return this.users.createInScope(actor, dto);
  }
}
