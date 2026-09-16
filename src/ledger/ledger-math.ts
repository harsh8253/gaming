export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum EntryDirection {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export type JournalLine = {
  direction: EntryDirection;
  amountMinor: number;
};

export class UnbalancedLedgerError extends Error {
  constructor(message = 'Ledger transaction is not balanced') {
    super(message);
    this.name = 'UnbalancedLedgerError';
  }
}

export function sumByDirection(entries: JournalLine[]): {
  debit: number;
  credit: number;
} {
  let debit = 0;
  let credit = 0;
  for (const entry of entries) {
    if (!Number.isInteger(entry.amountMinor) || entry.amountMinor <= 0) {
      throw new UnbalancedLedgerError('Amounts must be positive integers');
    }
    if (entry.direction === EntryDirection.DEBIT) {
      debit += entry.amountMinor;
    } else if (entry.direction === EntryDirection.CREDIT) {
      credit += entry.amountMinor;
    } else {
      throw new UnbalancedLedgerError('Unknown entry direction');
    }
  }
  return { debit, credit };
}

export function assertBalanced(entries: JournalLine[]): void {
  if (entries.length < 2) {
    throw new UnbalancedLedgerError('A journal needs at least two entries');
  }
  const { debit, credit } = sumByDirection(entries);
  if (debit !== credit) {
    throw new UnbalancedLedgerError(
      `Unbalanced journal: debit ${debit} != credit ${credit}`,
    );
  }
}

export function positionMinor(
  accountType: AccountType,
  entries: JournalLine[],
): number {
  const { debit, credit } = sumByDirection(entries);
  const debitNormal =
    accountType === AccountType.ASSET || accountType === AccountType.EXPENSE;
  return debitNormal ? debit - credit : credit - debit;
}

export function reverseEntries<
  T extends { accountId: string; direction: EntryDirection; amountMinor: number },
>(entries: T[]): T[] {
  return entries.map((entry) => ({
    ...entry,
    direction:
      entry.direction === EntryDirection.DEBIT
        ? EntryDirection.CREDIT
        : EntryDirection.DEBIT,
  }));
}
