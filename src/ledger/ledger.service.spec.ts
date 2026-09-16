import { LedgerService } from './ledger.service';
import { LedgerSide, type JournalLineRecord } from './ledger.types';

describe('LedgerService', () => {
  const service = Object.create(LedgerService.prototype) as LedgerService;

  it('derives balance as sum(credits) - sum(debits) for one account', () => {
    const lines: JournalLineRecord[] = [
      {
        id: '1',
        journalId: 'j1',
        accountUserId: 'u1',
        side: LedgerSide.CREDIT,
        amount: 500,
        createdAt: new Date(),
      },
      {
        id: '2',
        journalId: 'j1',
        accountUserId: 'u1',
        side: LedgerSide.DEBIT,
        amount: 200,
        createdAt: new Date(),
      },
      {
        id: '3',
        journalId: 'j2',
        accountUserId: 'u2',
        side: LedgerSide.CREDIT,
        amount: 999,
        createdAt: new Date(),
      },
    ];

    expect(service.computeBalance('u1', lines)).toEqual({
      accountUserId: 'u1',
      debitTotal: 200,
      creditTotal: 500,
      balance: 300,
    });
  });
});
