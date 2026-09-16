export enum LedgerSide {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export type JournalLineRecord = {
  id: string;
  journalId: string;
  accountUserId: string;
  side: LedgerSide;
  amount: number;
  createdAt: Date;
};

export type JournalRecord = {
  id: string;
  idempotencyKey: string;
  organizationId: string;
  postedByUserId: string;
  description: string | null;
  reversalOfId: string | null;
  createdAt: Date;
  lines: JournalLineRecord[];
};

export type NewJournalLine = {
  accountUserId: string;
  side: LedgerSide;
  amount: number;
};

export type NewJournalRecord = {
  idempotencyKey: string;
  organizationId: string;
  postedByUserId: string;
  description: string | null;
  reversalOfId: string | null;
  lines: NewJournalLine[];
};

export type AccountBalance = {
  accountUserId: string;
  debitTotal: number;
  creditTotal: number;
  /** creditTotal - debitTotal (user wallet / liability convention). */
  balance: number;
};
