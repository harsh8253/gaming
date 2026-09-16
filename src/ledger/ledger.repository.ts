import {
  JournalRecord,
  NewJournalRecord,
  type JournalLineRecord,
} from './ledger.types';

export const LEDGER_REPOSITORY = Symbol('LEDGER_REPOSITORY');

export interface LedgerRepository {
  findJournalByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<JournalRecord | null>;
  findJournalById(id: string): Promise<JournalRecord | null>;
  createJournal(input: NewJournalRecord): Promise<JournalRecord>;
  listLinesForAccounts(
    accountUserIds: string[],
  ): Promise<JournalLineRecord[]>;
}
