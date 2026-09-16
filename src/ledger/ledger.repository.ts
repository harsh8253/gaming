import {
  AccountRecord,
  LedgerEntryRecord,
  LedgerTransactionRecord,
  NewAccountRecord,
  NewLedgerEntryRecord,
  NewLedgerTransactionRecord,
  PostedJournal,
} from './ledger.types';

export const LEDGER_REPOSITORY = Symbol('LEDGER_REPOSITORY');

export interface LedgerRepository {
  createAccount(input: NewAccountRecord): Promise<AccountRecord>;
  findAccountById(id: string): Promise<AccountRecord | null>;
  findAccountByOwnerCode(
    ownerUserId: string,
    code: string,
    currency: string,
  ): Promise<AccountRecord | null>;
  listAccounts(): Promise<AccountRecord[]>;
  createJournal(
    transaction: NewLedgerTransactionRecord,
    entries: NewLedgerEntryRecord[],
  ): Promise<PostedJournal>;
  findJournalByIdempotency(
    postedByUserId: string,
    idempotencyKey: string,
  ): Promise<PostedJournal | null>;
  findJournalById(id: string): Promise<PostedJournal | null>;
  findReversalOf(transactionId: string): Promise<PostedJournal | null>;
  listEntriesByAccount(accountId: string): Promise<LedgerEntryRecord[]>;
}
