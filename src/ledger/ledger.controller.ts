import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../auth/current-user.decorator';
import { Permission } from '../permissions/permissions';
import { RequirePermission } from '../permissions/require-permission.decorator';
import { type UserRecord } from '../users/user.types';
import { PostJournalDto } from './dto/post-journal.dto';
import { ReverseJournalDto } from './dto/reverse-journal.dto';
import { LedgerService } from './ledger.service';

@Controller('ledger/transactions')
export class LedgerController {
  constructor(private readonly ledger: LedgerService) {}

  @Post()
  @RequirePermission(Permission.LEDGER_POST)
  async post(
    @CurrentUser() actor: UserRecord,
    @Body() dto: PostJournalDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { journal, replayed } = await this.ledger.postJournal(actor, dto);
    response.status(replayed ? 200 : 201);
    return this.ledger.toPublicJournal(journal);
  }

  @Get(':id')
  @RequirePermission(Permission.LEDGER_READ)
  async get(@CurrentUser() actor: UserRecord, @Param('id') id: string) {
    const journal = await this.ledger.getJournal(actor, id);
    return this.ledger.toPublicJournal(journal);
  }

  @Post(':id/reverse')
  @RequirePermission(Permission.LEDGER_POST)
  async reverse(
    @CurrentUser() actor: UserRecord,
    @Param('id') id: string,
    @Body() dto: ReverseJournalDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { journal, replayed } = await this.ledger.reverseJournal(
      actor,
      id,
      dto,
    );
    response.status(replayed ? 200 : 201);
    return this.ledger.toPublicJournal(journal);
  }
}
