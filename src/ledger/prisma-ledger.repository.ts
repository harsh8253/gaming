import { Injectable } from '@nestjs/common';
import { LedgerSide as PrismaLedgerSide } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { LedgerRepository } from './ledger.repository';
import {
  JournalLineRecord,
  JournalRecord,
  LedgerSide,
  NewJournalRecord,
} from './ledger.types';

@Injectable()
export class PrismaLedgerRepository implements LedgerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findJournalByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<JournalRecord | null> {
    const row = await this.prisma.journal.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId, idempotencyKey },
      },
      include: { lines: { orderBy: { createdAt: 'asc' } } },
    });
    return row ? this.toJournal(row) : null;
  }

  async findJournalById(id: string): Promise<JournalRecord | null> {
    const row = await this.prisma.journal.findUnique({
      where: { id },
      include: { lines: { orderBy: { createdAt: 'asc' } } },
    });
    return row ? this.toJournal(row) : null;
  }

  async createJournal(input: NewJournalRecord): Promise<JournalRecord> {
    try {
      const row = await this.prisma.journal.create({
        data: {
          idempotencyKey: input.idempotencyKey,
          organizationId: input.organizationId,
          postedByUserId: input.postedByUserId,
          description: input.description,
          reversalOfId: input.reversalOfId,
          lines: {
            create: input.lines.map((line) => ({
              accountUserId: line.accountUserId,
              side: line.side,
              amount: line.amount,
            })),
          },
        },
        include: { lines: { orderBy: { createdAt: 'asc' } } },
      });
      return this.toJournal(row);
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === 'P2002'
      ) {
        const existing = await this.findJournalByIdempotencyKey(
          input.organizationId,
          input.idempotencyKey,
        );
        if (existing) {
          return existing;
        }
      }
      throw error;
    }
  }

  async listLinesForAccounts(
    accountUserIds: string[],
  ): Promise<JournalLineRecord[]> {
    if (accountUserIds.length === 0) {
      return [];
    }
    const rows = await this.prisma.journalLine.findMany({
      where: { accountUserId: { in: accountUserIds } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((row) => this.toLine(row));
  }

  private toJournal(row: {
    id: string;
    idempotencyKey: string;
    organizationId: string;
    postedByUserId: string;
    description: string | null;
    reversalOfId: string | null;
    createdAt: Date;
    lines: Array<{
      id: string;
      journalId: string;
      accountUserId: string;
      side: PrismaLedgerSide;
      amount: number;
      createdAt: Date;
    }>;
  }): JournalRecord {
    return {
      id: row.id,
      idempotencyKey: row.idempotencyKey,
      organizationId: row.organizationId,
      postedByUserId: row.postedByUserId,
      description: row.description,
      reversalOfId: row.reversalOfId,
      createdAt: row.createdAt,
      lines: row.lines.map((line) => this.toLine(line)),
    };
  }

  private toLine(row: {
    id: string;
    journalId: string;
    accountUserId: string;
    side: PrismaLedgerSide;
    amount: number;
    createdAt: Date;
  }): JournalLineRecord {
    return {
      id: row.id,
      journalId: row.journalId,
      accountUserId: row.accountUserId,
      side: LedgerSide[row.side],
      amount: row.amount,
      createdAt: row.createdAt,
    };
  }
}
