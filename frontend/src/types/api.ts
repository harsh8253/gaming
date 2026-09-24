export type Role = 'SUPER_MASTER' | 'SUPER_ADMIN' | 'MASTER' | 'CLIENT';

export type PublicUser = {
  id: string;
  username: string;
  role: Role;
  parentUserId: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
};

export type LoginResponse = {
  accessToken: string;
  user: PublicUser;
};

export type LedgerSide = 'DEBIT' | 'CREDIT';

export type JournalLine = {
  id: string;
  journalId: string;
  accountUserId: string;
  side: LedgerSide;
  amount: number;
  createdAt: string;
};

export type Journal = {
  id: string;
  idempotencyKey: string;
  organizationId: string;
  postedByUserId: string;
  description: string | null;
  reversalOfId: string | null;
  createdAt: string;
  lines: JournalLine[];
};

export type AccountBalance = {
  accountUserId: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
};

export type ApiErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};
