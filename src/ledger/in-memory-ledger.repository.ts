import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { LedgerRepository } from './ledger.repository';
import {
  JournalLineRecord,
  JournalRecord,
  NewJournalRecord,
} from './ledger.types';

@Injectable()
export class InMemoryLedgerRepository implements LedgerRepository {
  private readonly journals = new Map<string, JournalRecord>();

  findJournalByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<JournalRecord | null> {
    const found = [...this.journals.values()].find(
      (journal) =>
        journal.organizationId === organizationId &&
        journal.idempotencyKey === idempotencyKey,
    );
    return Promise.resolve(found ? this.clone(found) : null);
  }

  findJournalById(id: string): Promise<JournalRecord | null> {
    const found = this.journals.get(id);
    return Promise.resolve(found ? this.clone(found) : null);
  }

  createJournal(input: NewJournalRecord): Promise<JournalRecord> {
    const existing = [...this.journals.values()].find(
      (journal) =>
        journal.organizationId === input.organizationId &&
        journal.idempotencyKey === input.idempotencyKey,
    );
    if (existing) {
      return Promise.resolve(this.clone(existing));
    }

    const journalId = randomUUID();
    const now = new Date();
    const lines: JournalLineRecord[] = input.lines.map((line) => ({
      id: randomUUID(),
      journalId,
      accountUserId: line.accountUserId,
      side: line.side,
      amount: line.amount,
      createdAt: now,
    }));

    const record: JournalRecord = {
      id: journalId,
      idempotencyKey: input.idempotencyKey,
      organizationId: input.organizationId,
      postedByUserId: input.postedByUserId,
      description: input.description,
      reversalOfId: input.reversalOfId,
      createdAt: now,
      lines,
    };
    this.journals.set(record.id, record);
    return Promise.resolve(this.clone(record));
  }

  listLinesForAccounts(
    accountUserIds: string[],
  ): Promise<JournalLineRecord[]> {
    const allowed = new Set(accountUserIds);
    const lines = [...this.journals.values()]
      .flatMap((journal) => journal.lines)
      .filter((line) => allowed.has(line.accountUserId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return Promise.resolve(lines.map((line) => ({ ...line })));
  }

  private clone(journal: JournalRecord): JournalRecord {
    return {
      ...journal,
      lines: journal.lines.map((line) => ({ ...line })),
    };
  }
}
