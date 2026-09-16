import { Injectable } from '@nestjs/common';
import {
  AccountType as PrismaAccountType,
  EntryDirection as PrismaEntryDirection,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccountType, EntryDirection } from './ledger-math';
import { LedgerRepository } from './ledger.repository';
import {
  AccountCode,
  AccountRecord,
  LedgerEntryRecord,
  NewAccountRecord,
  NewLedgerEntryRecord,
  NewLedgerTransactionRecord,
  PostedJournal,
} from './ledger.types';

@Injectable()
export class PrismaLedgerRepository implements LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createAccount(input: NewAccountRecord): Promise<AccountRecord> {
    const row = await this.prisma.account.create({
      data: {
        ownerUserId: input.ownerUserId,
        code: input.code,
        type: input.type,
        currency: input.currency,
        organizationId: input.organizationId,
      },
    });
    return this.toAccount(row);
  }

  async findAccountById(id: string): Promise<AccountRecord | null> {
    const row = await this.prisma.account.findUnique({ where: { id } });
    return row ? this.toAccount(row) : null;
  }

  async findAccountByOwnerCode(
    ownerUserId: string,
    code: string,
    currency: string,
  ): Promise<AccountRecord | null> {
    const row = await this.prisma.account.findUnique({
      where: {
        ownerUserId_code_currency: { ownerUserId, code, currency },
      },
    });
    return row ? this.toAccount(row) : null;
  }

  async listAccounts(): Promise<AccountRecord[]> {
    const rows = await this.prisma.account.findMany();
    return rows.map((row) => this.toAccount(row));
  }

  async createJournal(
    transaction: NewLedgerTransactionRecord,
    entries: NewLedgerEntryRecord[],
  ): Promise<PostedJournal> {
    const row = await this.prisma.ledgerTransaction.create({
      data: {
        idempotencyKey: transaction.idempotencyKey,
        postedByUserId: transaction.postedByUserId,
        sourceEventType: transaction.sourceEventType,
        sourceEventId: transaction.sourceEventId,
        reversesTransactionId: transaction.reversesTransactionId,
        description: transaction.description,
        organizationId: transaction.organizationId,
        entries: {
          create: entries.map((entry) => ({
            accountId: entry.accountId,
            direction: entry.direction,
            amountMinor: entry.amountMinor,
            sourceEventType: entry.sourceEventType,
            sourceEventId: entry.sourceEventId,
          })),
        },
      },
      include: { entries: true },
    });
    return this.toJournal(row);
  }

  async findJournalByIdempotency(
    postedByUserId: string,
    idempotencyKey: string,
  ): Promise<PostedJournal | null> {
    const row = await this.prisma.ledgerTransaction.findUnique({
      where: {
        postedByUserId_idempotencyKey: { postedByUserId, idempotencyKey },
      },
      include: { entries: true },
    });
    return row ? this.toJournal(row) : null;
  }

  async findJournalById(id: string): Promise<PostedJournal | null> {
    const row = await this.prisma.ledgerTransaction.findUnique({
      where: { id },
      include: { entries: true },
    });
    return row ? this.toJournal(row) : null;
  }

  async findReversalOf(transactionId: string): Promise<PostedJournal | null> {
    const row = await this.prisma.ledgerTransaction.findFirst({
      where: { reversesTransactionId: transactionId },
      include: { entries: true },
    });
    return row ? this.toJournal(row) : null;
  }

  async listEntriesByAccount(accountId: string): Promise<LedgerEntryRecord[]> {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { accountId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.toEntry(row));
  }

  private toAccount(row: {
    id: string;
    ownerUserId: string;
    code: string;
    type: PrismaAccountType;
    currency: string;
    organizationId: string;
    createdAt: Date;
  }): AccountRecord {
    return {
      id: row.id,
      ownerUserId: row.ownerUserId,
      code: row.code as AccountCode,
      type: AccountType[row.type],
      currency: row.currency,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
    };
  }

  private toEntry(row: {
    id: string;
    transactionId: string;
    accountId: string;
    direction: PrismaEntryDirection;
    amountMinor: number;
    sourceEventType: string;
    sourceEventId: string;
    createdAt: Date;
  }): LedgerEntryRecord {
    return {
      id: row.id,
      transactionId: row.transactionId,
      accountId: row.accountId,
      direction: EntryDirection[row.direction],
      amountMinor: row.amountMinor,
      sourceEventType: row.sourceEventType,
      sourceEventId: row.sourceEventId,
      createdAt: row.createdAt,
    };
  }

  private toJournal(row: {
    id: string;
    idempotencyKey: string;
    postedByUserId: string;
    sourceEventType: string;
    sourceEventId: string;
    reversesTransactionId: string | null;
    description: string;
    organizationId: string;
    createdAt: Date;
    entries: Array<{
      id: string;
      transactionId: string;
      accountId: string;
      direction: PrismaEntryDirection;
      amountMinor: number;
      sourceEventType: string;
      sourceEventId: string;
      createdAt: Date;
    }>;
  }): PostedJournal {
    return {
      transaction: {
        id: row.id,
        idempotencyKey: row.idempotencyKey,
        postedByUserId: row.postedByUserId,
        sourceEventType: row.sourceEventType,
        sourceEventId: row.sourceEventId,
        reversesTransactionId: row.reversesTransactionId,
        description: row.description,
        organizationId: row.organizationId,
        createdAt: row.createdAt,
      },
      entries: row.entries.map((entry) => this.toEntry(entry)),
    };
  }
}
