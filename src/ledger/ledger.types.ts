import { AccountType, EntryDirection } from './ledger-math';

export enum AccountCode {
  WALLET = 'WALLET',
  CASH = 'CASH',
}

export function accountTypeForCode(code: AccountCode): AccountType {
  if (code === AccountCode.CASH) {
    return AccountType.ASSET;
  }
  return AccountType.LIABILITY;
}

export type AccountRecord = {
  id: string;
  ownerUserId: string;
  code: AccountCode;
  type: AccountType;
  currency: string;
  organizationId: string;
  createdAt: Date;
};

export type NewAccountRecord = Omit<AccountRecord, 'id' | 'createdAt'>;

export type LedgerTransactionRecord = {
  id: string;
  idempotencyKey: string;
  postedByUserId: string;
  sourceEventType: string;
  sourceEventId: string;
  reversesTransactionId: string | null;
  description: string;
  organizationId: string;
  createdAt: Date;
};

export type NewLedgerTransactionRecord = Omit<
  LedgerTransactionRecord,
  'id' | 'createdAt'
>;

export type LedgerEntryRecord = {
  id: string;
  transactionId: string;
  accountId: string;
  direction: EntryDirection;
  amountMinor: number;
  sourceEventType: string;
  sourceEventId: string;
  createdAt: Date;
};

export type NewLedgerEntryRecord = Omit<
  LedgerEntryRecord,
  'id' | 'transactionId' | 'createdAt'
>;

export type PostedJournal = {
  transaction: LedgerTransactionRecord;
  entries: LedgerEntryRecord[];
};
