import {
  AccountType,
  EntryDirection,
  UnbalancedLedgerError,
  assertBalanced,
  positionMinor,
  reverseEntries,
} from './ledger-math';

describe('ledger-math', () => {
  it('accepts a balanced two-line journal', () => {
    expect(() =>
      assertBalanced([
        { direction: EntryDirection.DEBIT, amountMinor: 1000 },
        { direction: EntryDirection.CREDIT, amountMinor: 1000 },
      ]),
    ).not.toThrow();
  });

  it('rejects an unbalanced journal', () => {
    expect(() =>
      assertBalanced([
        { direction: EntryDirection.DEBIT, amountMinor: 1000 },
        { direction: EntryDirection.CREDIT, amountMinor: 900 },
      ]),
    ).toThrow(UnbalancedLedgerError);
  });

  it('rejects a single-sided journal', () => {
    expect(() =>
      assertBalanced([{ direction: EntryDirection.DEBIT, amountMinor: 1000 }]),
    ).toThrow(UnbalancedLedgerError);
  });

  it('derives asset position as debits minus credits', () => {
    const position = positionMinor(AccountType.ASSET, [
      { direction: EntryDirection.DEBIT, amountMinor: 500 },
      { direction: EntryDirection.CREDIT, amountMinor: 200 },
      { direction: EntryDirection.DEBIT, amountMinor: 50 },
    ]);
    expect(position).toBe(350);
  });

  it('derives liability position as credits minus debits', () => {
    const position = positionMinor(AccountType.LIABILITY, [
      { direction: EntryDirection.CREDIT, amountMinor: 1000 },
      { direction: EntryDirection.DEBIT, amountMinor: 250 },
    ]);
    expect(position).toBe(750);
  });

  it('builds reversal entries by swapping debit and credit', () => {
    const reversed = reverseEntries([
      {
        accountId: 'cash',
        direction: EntryDirection.DEBIT,
        amountMinor: 1000,
      },
      {
        accountId: 'wallet',
        direction: EntryDirection.CREDIT,
        amountMinor: 1000,
      },
    ]);
    expect(reversed).toEqual([
      {
        accountId: 'cash',
        direction: EntryDirection.CREDIT,
        amountMinor: 1000,
      },
      {
        accountId: 'wallet',
        direction: EntryDirection.DEBIT,
        amountMinor: 1000,
      },
    ]);
  });
});
