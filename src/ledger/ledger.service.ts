import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthorizationService } from '../permissions/authorization.service';
import { Permission } from '../permissions/permissions';
import { UsersService } from '../users/users.service';
import { type UserRecord } from '../users/user.types';
import { OpenAccountDto } from './dto/open-account.dto';
import { PostJournalDto } from './dto/post-journal.dto';
import { ReverseJournalDto } from './dto/reverse-journal.dto';
import {
  UnbalancedLedgerError,
  assertBalanced,
  positionMinor,
  reverseEntries,
} from './ledger-math';
import { LEDGER_REPOSITORY, type LedgerRepository } from './ledger.repository';
import {
  AccountRecord,
  LedgerEntryRecord,
  PostedJournal,
  accountTypeForCode,
} from './ledger.types';

@Injectable()
export class LedgerService {
  constructor(
    @Inject(LEDGER_REPOSITORY) private readonly ledger: LedgerRepository,
    private readonly users: UsersService,
    private readonly authorization: AuthorizationService,
  ) {}

  async openAccount(actor: UserRecord, dto: OpenAccountDto) {
    this.authorization.assertPermission(actor.role, Permission.ACCOUNT_OPEN);
    const owner = await this.users.requireVisibleUser(actor, dto.ownerUserId);
    const currency = dto.currency ?? 'USD';
    const existing = await this.ledger.findAccountByOwnerCode(
      owner.id,
      dto.code,
      currency,
    );
    if (existing) {
      throw new ConflictException('Account already exists for that code');
    }

    return this.ledger.createAccount({
      ownerUserId: owner.id,
      code: dto.code,
      type: accountTypeForCode(dto.code),
      currency,
      organizationId: owner.organizationId,
    });
  }

  async getAccount(actor: UserRecord, id: string): Promise<AccountRecord> {
    this.authorization.assertPermission(actor.role, Permission.ACCOUNT_READ);
    const account = await this.ledger.findAccountById(id);
    if (!account) {
      throw new NotFoundException('Account not found');
    }
    await this.users.requireVisibleUser(actor, account.ownerUserId);
    return account;
  }

  async position(actor: UserRecord, accountId: string) {
    const account = await this.getAccount(actor, accountId);
    const entries = await this.ledger.listEntriesByAccount(account.id);
    return {
      accountId: account.id,
      currency: account.currency,
      positionMinor: positionMinor(account.type, entries),
    };
  }

  async statement(actor: UserRecord, accountId: string) {
    const account = await this.getAccount(actor, accountId);
    const entries = await this.ledger.listEntriesByAccount(account.id);
    const seen: LedgerEntryRecord[] = [];
    const lines = entries.map((entry) => {
      seen.push(entry);
      return {
        ...entry,
        runningPositionMinor: positionMinor(account.type, seen),
      };
    });
    return {
      account,
      positionMinor: positionMinor(account.type, entries),
      entries: lines,
    };
  }

  async postJournal(
    actor: UserRecord,
    dto: PostJournalDto,
  ): Promise<{ journal: PostedJournal; replayed: boolean }> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_POST);
    const existing = await this.ledger.findJournalByIdempotency(
      actor.id,
      dto.idempotencyKey,
    );
    if (existing) {
      await this.assertJournalInScope(actor, existing);
      return { journal: existing, replayed: true };
    }

    try {
      assertBalanced(dto.entries);
    } catch (error) {
      if (error instanceof UnbalancedLedgerError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    await this.loadAccountsInScope(
      actor,
      dto.entries.map((entry) => entry.accountId),
    );
    const journal = await this.ledger.createJournal(
      {
        idempotencyKey: dto.idempotencyKey,
        postedByUserId: actor.id,
        sourceEventType: dto.sourceEventType,
        sourceEventId: dto.sourceEventId,
        reversesTransactionId: null,
        description: dto.description ?? '',
        organizationId: actor.organizationId,
      },
      dto.entries.map((entry) => ({
        accountId: entry.accountId,
        direction: entry.direction,
        amountMinor: entry.amountMinor,
        sourceEventType: dto.sourceEventType,
        sourceEventId: dto.sourceEventId,
      })),
    );
    return { journal, replayed: false };
  }

  async getJournal(actor: UserRecord, id: string): Promise<PostedJournal> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_READ);
    const journal = await this.ledger.findJournalById(id);
    if (!journal) {
      throw new NotFoundException('Transaction not found');
    }
    await this.assertJournalInScope(actor, journal);
    return journal;
  }

  async reverseJournal(
    actor: UserRecord,
    transactionId: string,
    dto: ReverseJournalDto,
  ): Promise<{ journal: PostedJournal; replayed: boolean }> {
    this.authorization.assertPermission(actor.role, Permission.LEDGER_POST);
    const existing = await this.ledger.findJournalByIdempotency(
      actor.id,
      dto.idempotencyKey,
    );
    if (existing) {
      await this.assertJournalInScope(actor, existing);
      return { journal: existing, replayed: true };
    }

    const original = await this.ledger.findJournalById(transactionId);
    if (!original) {
      throw new NotFoundException('Transaction not found');
    }
    await this.assertJournalInScope(actor, original);

    const already = await this.ledger.findReversalOf(transactionId);
    if (already) {
      throw new ConflictException('Transaction already reversed');
    }

    const journal = await this.ledger.createJournal(
      {
        idempotencyKey: dto.idempotencyKey,
        postedByUserId: actor.id,
        sourceEventType: 'REVERSAL',
        sourceEventId: dto.sourceEventId,
        reversesTransactionId: original.transaction.id,
        description: `Reversal of ${original.transaction.id}`,
        organizationId: actor.organizationId,
      },
      reverseEntries(original.entries).map((entry) => ({
        accountId: entry.accountId,
        direction: entry.direction,
        amountMinor: entry.amountMinor,
        sourceEventType: 'REVERSAL',
        sourceEventId: dto.sourceEventId,
      })),
    );
    return { journal, replayed: false };
  }

  private async loadAccountsInScope(actor: UserRecord, accountIds: string[]) {
    const uniqueIds = [...new Set(accountIds)];
    const accounts: AccountRecord[] = [];
    for (const id of uniqueIds) {
      const account = await this.ledger.findAccountById(id);
      if (!account) {
        throw new NotFoundException('Account not found');
      }
      await this.users.requireVisibleUser(actor, account.ownerUserId);
      accounts.push(account);
    }
    return accounts;
  }

  private async assertJournalInScope(
    actor: UserRecord,
    journal: PostedJournal,
  ): Promise<void> {
    try {
      await this.loadAccountsInScope(
        actor,
        journal.entries.map((entry) => entry.accountId),
      );
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw new ForbiddenException('Resource is outside hierarchy scope');
      }
      throw error;
    }
  }

  toPublicJournal(journal: PostedJournal) {
    return {
      id: journal.transaction.id,
      idempotencyKey: journal.transaction.idempotencyKey,
      postedByUserId: journal.transaction.postedByUserId,
      sourceEventType: journal.transaction.sourceEventType,
      sourceEventId: journal.transaction.sourceEventId,
      reversesTransactionId: journal.transaction.reversesTransactionId,
      description: journal.transaction.description,
      organizationId: journal.transaction.organizationId,
      createdAt: journal.transaction.createdAt,
      entries: journal.entries.map((entry: LedgerEntryRecord) => ({
        id: entry.id,
        transactionId: entry.transactionId,
        accountId: entry.accountId,
        direction: entry.direction,
        amountMinor: entry.amountMinor,
        sourceEventType: entry.sourceEventType,
        sourceEventId: entry.sourceEventId,
        createdAt: entry.createdAt,
      })),
    };
  }
}
