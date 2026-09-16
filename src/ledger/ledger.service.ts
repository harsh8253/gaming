import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { AuthorizationService } from '../permissions/authorization.service';
import { Permission } from '../permissions/permissions';
import { UsersService } from '../users/users.service';
import type { UserRecord } from '../users/user.types';
import { PostJournalDto } from './dto/post-journal.dto';
import { LEDGER_REPOSITORY, type LedgerRepository } from './ledger.repository';
import {
  AccountBalance,
  JournalLineRecord,
  JournalRecord,
  LedgerSide,
  NewJournalLine,
} from './ledger.types';

@Injectable()
export class LedgerService {
  constructor(
    @Inject(LEDGER_REPOSITORY) private readonly ledger: LedgerRepository,
    private readonly users: UsersService,
    private readonly hierarchy: HierarchyService,
    private readonly authorization: AuthorizationService,
  ) {}

  async postJournal(
    actor: UserRecord,
    dto: PostJournalDto,
    idempotencyKey: string | undefined,
  ): Promise<JournalRecord> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_POST);
    const key = this.requireIdempotencyKey(idempotencyKey);

    const existing = await this.ledger.findJournalByIdempotencyKey(
      actor.organizationId,
      key,
    );
    if (existing) {
      return existing;
    }

    const lines = this.normalizeAndAssertBalanced(dto.lines);
    await this.assertAccountsInScope(
      actor,
      lines.map((line) => line.accountUserId),
    );

    return this.ledger.createJournal({
      idempotencyKey: key,
      organizationId: actor.organizationId,
      postedByUserId: actor.id,
      description: dto.description ?? null,
      reversalOfId: null,
      lines,
    });
  }

  async reverseJournal(
    actor: UserRecord,
    journalId: string,
    idempotencyKey: string | undefined,
  ): Promise<JournalRecord> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_POST);
    const key = this.requireIdempotencyKey(idempotencyKey);

    const existing = await this.ledger.findJournalByIdempotencyKey(
      actor.organizationId,
      key,
    );
    if (existing) {
      return existing;
    }

    const original = await this.ledger.findJournalById(journalId);
    if (!original || original.organizationId !== actor.organizationId) {
      throw new NotFoundException('Journal not found');
    }

    await this.assertAccountsInScope(
      actor,
      original.lines.map((line) => line.accountUserId),
    );

    const lines: NewJournalLine[] = original.lines.map((line) => ({
      accountUserId: line.accountUserId,
      side:
        line.side === LedgerSide.DEBIT ? LedgerSide.CREDIT : LedgerSide.DEBIT,
      amount: line.amount,
    }));

    return this.ledger.createJournal({
      idempotencyKey: key,
      organizationId: actor.organizationId,
      postedByUserId: actor.id,
      description: `Reversal of ${original.id}`,
      reversalOfId: original.id,
      lines,
    });
  }

  async getBalance(
    actor: UserRecord,
    accountUserId: string,
  ): Promise<AccountBalance> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_READ);
    await this.assertAccountsInScope(actor, [accountUserId]);

    const lines = await this.ledger.listLinesForAccounts([accountUserId]);
    return this.computeBalance(accountUserId, lines);
  }

  async listEntriesInScope(
    actor: UserRecord,
    accountUserId?: string,
  ): Promise<JournalLineRecord[]> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_READ);

    if (accountUserId) {
      await this.assertAccountsInScope(actor, [accountUserId]);
      return this.ledger.listLinesForAccounts([accountUserId]);
    }

    const allUsers = await this.users.listAllRecords();
    const visibleIds = this.hierarchy
      .visibleUsers(actor, allUsers)
      .map((user) => user.id);
    return this.ledger.listLinesForAccounts(visibleIds);
  }

  computeBalance(
    accountUserId: string,
    lines: JournalLineRecord[],
  ): AccountBalance {
    let debitTotal = 0;
    let creditTotal = 0;
    for (const line of lines) {
      if (line.accountUserId !== accountUserId) {
        continue;
      }
      if (line.side === LedgerSide.DEBIT) {
        debitTotal += line.amount;
      } else {
        creditTotal += line.amount;
      }
    }
    return {
      accountUserId,
      debitTotal,
      creditTotal,
      balance: creditTotal - debitTotal,
    };
  }

  private requireIdempotencyKey(key: string | undefined): string {
    if (!key || key.trim().length === 0) {
      throw new BadRequestException('Idempotency-Key header is required');
    }
    return key.trim();
  }

  private normalizeAndAssertBalanced(
    lines: PostJournalDto['lines'],
  ): NewJournalLine[] {
    if (!lines || lines.length < 2) {
      throw new BadRequestException('Journal must have at least two lines');
    }

    let debitTotal = 0;
    let creditTotal = 0;
    const normalized: NewJournalLine[] = [];

    for (const line of lines) {
      if (!Number.isInteger(line.amount) || line.amount < 1) {
        throw new BadRequestException('Line amounts must be positive integers');
      }
      if (line.side === LedgerSide.DEBIT) {
        debitTotal += line.amount;
      } else if (line.side === LedgerSide.CREDIT) {
        creditTotal += line.amount;
      } else {
        throw new BadRequestException('Invalid ledger side');
      }
      normalized.push({
        accountUserId: line.accountUserId,
        side: line.side,
        amount: line.amount,
      });
    }

    if (debitTotal !== creditTotal) {
      throw new BadRequestException(
        `Journal is unbalanced: debits=${debitTotal} credits=${creditTotal}`,
      );
    }

    return normalized;
  }

  private async assertAccountsInScope(
    actor: UserRecord,
    accountUserIds: string[],
  ): Promise<void> {
    const allUsers = await this.users.listAllRecords();
    const byId = new Map(allUsers.map((user) => [user.id, user]));

    for (const accountUserId of new Set(accountUserIds)) {
      const target = byId.get(accountUserId);
      if (!target) {
        throw new NotFoundException(`Account user ${accountUserId} not found`);
      }
      if (!this.hierarchy.isInScope(actor, target, allUsers)) {
        throw new ForbiddenException('Resource is outside hierarchy scope');
      }
    }
  }
}
