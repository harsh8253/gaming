import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permission } from '../permissions/permissions';
import { RequirePermission } from '../permissions/require-permission.decorator';
import type { UserRecord } from '../users/user.types';
import { PostJournalDto } from './dto/post-journal.dto';
import { LedgerService } from './ledger.service';

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Post('journals')
  @RequirePermission(Permission.LEDGER_POST)
  postJournal(
    @CurrentUser() actor: UserRecord,
    @Body() dto: PostJournalDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ledger.postJournal(actor, dto, idempotencyKey);
  }

  @Post('journals/:id/reverse')
  @RequirePermission(Permission.LEDGER_POST)
  reverseJournal(
    @CurrentUser() actor: UserRecord,
    @Param('id') id: string,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.ledger.reverseJournal(actor, id, idempotencyKey);
  }

  @Get('balances/:userId')
  @RequirePermission(Permission.LEDGER_READ)
  getBalance(
    @CurrentUser() actor: UserRecord,
    @Param('userId') userId: string,
  ) {
    return this.ledger.getBalance(actor, userId);
  }

  @Get('entries')
  @RequirePermission(Permission.LEDGER_READ)
  listEntries(
    @CurrentUser() actor: UserRecord,
    @Query('accountUserId') accountUserId?: string,
  ) {
    return this.ledger.listEntriesInScope(actor, accountUserId);
  }
}
