import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permission } from '../permissions/permissions';
import { RequirePermission } from '../permissions/require-permission.decorator';
import { type UserRecord } from '../users/user.types';
import { OpenAccountDto } from './dto/open-account.dto';
import { LedgerService } from './ledger.service';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly ledger: LedgerService) {}

  @Post()
  @RequirePermission(Permission.ACCOUNT_OPEN)
  open(@CurrentUser() actor: UserRecord, @Body() dto: OpenAccountDto) {
    return this.ledger.openAccount(actor, dto);
  }

  @Get(':id')
  @RequirePermission(Permission.ACCOUNT_READ)
  get(@CurrentUser() actor: UserRecord, @Param('id') id: string) {
    return this.ledger.getAccount(actor, id);
  }

  @Get(':id/position')
  @RequirePermission(Permission.ACCOUNT_READ)
  position(@CurrentUser() actor: UserRecord, @Param('id') id: string) {
    return this.ledger.position(actor, id);
  }

  @Get(':id/statement')
  @RequirePermission(Permission.ACCOUNT_READ)
  statement(@CurrentUser() actor: UserRecord, @Param('id') id: string) {
    return this.ledger.statement(actor, id);
  }
}
