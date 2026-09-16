import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { LedgerRepository } from './ledger.repository';
import {
  AccountRecord,
  LedgerEntryRecord,
  NewAccountRecord,
  NewLedgerEntryRecord,
  NewLedgerTransactionRecord,
  PostedJournal,
} from './ledger.types';

@Injectable()
export class InMemoryLedgerRepository implements LedgerRepository {
  private readonly accounts = new Map<string, AccountRecord>();
  private readonly journals = new Map<string, PostedJournal>();

  createAccount(input: NewAccountRecord): Promise<AccountRecord> {
    const record: AccountRecord = {
      id: randomUUID(),
      ...input,
      createdAt: new Date(),
    };
    this.accounts.set(record.id, record);
    return Promise.resolve(record);
  }

  findAccountById(id: string): Promise<AccountRecord | null> {
    return Promise.resolve(this.accounts.get(id) ?? null);
  }

  findAccountByOwnerCode(
    ownerUserId: string,
    code: string,
    currency: string,
  ): Promise<AccountRecord | null> {
    return Promise.resolve(
      [...this.accounts.values()].find(
        (account) =>
          account.ownerUserId === ownerUserId &&
          account.code === code &&
          account.currency === currency,
      ) ?? null,
    );
  }

  listAccounts(): Promise<AccountRecord[]> {
    return Promise.resolve([...this.accounts.values()]);
  }

  createJournal(
    transaction: NewLedgerTransactionRecord,
    entries: NewLedgerEntryRecord[],
  ): Promise<PostedJournal> {
    const id = randomUUID();
    const createdAt = new Date();
    const storedEntries: LedgerEntryRecord[] = entries.map((entry) => ({
      id: randomUUID(),
      transactionId: id,
      ...entry,
      createdAt,
    }));
    const journal: PostedJournal = {
      transaction: { id, ...transaction, createdAt },
      entries: storedEntries,
    };
    this.journals.set(id, journal);
    return Promise.resolve(journal);
  }

  findJournalByIdempotency(
    postedByUserId: string,
    idempotencyKey: string,
  ): Promise<PostedJournal | null> {
    return Promise.resolve(
      [...this.journals.values()].find(
        (journal) =>
          journal.transaction.postedByUserId === postedByUserId &&
          journal.transaction.idempotencyKey === idempotencyKey,
      ) ?? null,
    );
  }

  findJournalById(id: string): Promise<PostedJournal | null> {
    return Promise.resolve(this.journals.get(id) ?? null);
  }

  findReversalOf(transactionId: string): Promise<PostedJournal | null> {
    return Promise.resolve(
      [...this.journals.values()].find(
        (journal) =>
          journal.transaction.reversesTransactionId === transactionId,
      ) ?? null,
    );
  }

  listEntriesByAccount(accountId: string): Promise<LedgerEntryRecord[]> {
    const entries = [...this.journals.values()].flatMap(
      (journal) => journal.entries,
    );
    return Promise.resolve(
      entries
        .filter((entry) => entry.accountId === accountId)
        .sort(
          (left, right) =>
            left.createdAt.getTime() - right.createdAt.getTime() ||
            left.id.localeCompare(right.id),
        ),
    );
  }
}
