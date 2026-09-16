import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { SuperTest, Test as SuperTestRequest } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import {
  AccountBalance,
  JournalRecord,
  LedgerSide,
} from '../src/ledger/ledger.types';
import { PublicUser, Role } from '../src/users/user.types';

type LoginBody = { accessToken: string; user: PublicUser };

describe('S2 double-entry ledger', () => {
  let app: INestApplication;
  let http: SuperTest<SuperTestRequest>;
  let masterAToken: string;
  let masterBToken: string;
  let masterA: PublicUser;
  let clientA: PublicUser;
  let clientB: PublicUser;

  const password = 'password12';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
    http = request(app.getHttpServer() as Parameters<typeof request>[0]);

    const rootToken = await login('root', 'changeme');
    await createUser(rootToken, 'sa-ledger', Role.SUPER_ADMIN).expect(201);
    const saToken = await login('sa-ledger', password);
    await createUser(saToken, 'master-ledger-a', Role.MASTER).expect(201);
    await createUser(saToken, 'master-ledger-b', Role.MASTER).expect(201);

    masterAToken = await login('master-ledger-a', password);
    masterBToken = await login('master-ledger-b', password);
    masterA = await me(masterAToken);

    const clientAResponse = await createUser(
      masterAToken,
      'client-ledger-a',
      Role.CLIENT,
    ).expect(201);
    clientA = clientAResponse.body as PublicUser;

    const clientBResponse = await createUser(
      masterBToken,
      'client-ledger-b',
      Role.CLIENT,
    ).expect(201);
    clientB = clientBResponse.body as PublicUser;
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(
    username: string,
    userPassword: string,
  ): Promise<string> {
    const response = await http
      .post('/auth/login')
      .send({ username, password: userPassword })
      .expect(200);
    return (response.body as LoginBody).accessToken;
  }

  function createUser(token: string, username: string, role: Role) {
    return http
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username, password, role });
  }

  async function me(token: string): Promise<PublicUser> {
    const response = await http
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return response.body as PublicUser;
  }

  function postJournal(
    token: string,
    idempotencyKey: string,
    body: Record<string, unknown>,
  ) {
    return http
      .post('/ledger/journals')
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', idempotencyKey)
      .send(body);
  }

  it('posts a balanced journal and derives balance from lines', async () => {
    const key = 'balanced-post-1';
    const response = await postJournal(masterAToken, key, {
      description: 'seed client wallet',
      postedByUserId: 'attacker',
      organizationId: 'org-other',
      lines: [
        {
          accountUserId: masterA.id,
          side: LedgerSide.DEBIT,
          amount: 1000,
        },
        {
          accountUserId: clientA.id,
          side: LedgerSide.CREDIT,
          amount: 1000,
        },
      ],
    }).expect(201);

    const journal = response.body as JournalRecord;
    expect(journal.postedByUserId).toBe(masterA.id);
    expect(journal.organizationId).toBe(masterA.organizationId);
    expect(journal.idempotencyKey).toBe(key);
    expect(journal.lines).toHaveLength(2);

    const balanceResponse = await http
      .get(`/ledger/balances/${clientA.id}`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);

    const balance = balanceResponse.body as AccountBalance;
    expect(balance.accountUserId).toBe(clientA.id);
    expect(balance.creditTotal).toBe(1000);
    expect(balance.debitTotal).toBe(0);
    expect(balance.balance).toBe(1000);
    expect(balance.balance).toBe(balance.creditTotal - balance.debitTotal);

    const entries = await http
      .get(`/ledger/entries?accountUserId=${clientA.id}`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    const lines = entries.body as JournalRecord['lines'];
    const summed =
      lines
        .filter((line) => line.side === LedgerSide.CREDIT)
        .reduce((sum, line) => sum + line.amount, 0) -
      lines
        .filter((line) => line.side === LedgerSide.DEBIT)
        .reduce((sum, line) => sum + line.amount, 0);
    expect(balance.balance).toBe(summed);
  });

  it('rejects an unbalanced journal', async () => {
    await postJournal(masterAToken, 'unbalanced-1', {
      lines: [
        {
          accountUserId: masterA.id,
          side: LedgerSide.DEBIT,
          amount: 100,
        },
        {
          accountUserId: clientA.id,
          side: LedgerSide.CREDIT,
          amount: 50,
        },
      ],
    }).expect(400);
  });

  it('retries with the same idempotency key do not double-post', async () => {
    const key = 'idempotent-retry-1';
    const body = {
      description: 'idempotent transfer',
      lines: [
        {
          accountUserId: masterA.id,
          side: LedgerSide.DEBIT,
          amount: 250,
        },
        {
          accountUserId: clientA.id,
          side: LedgerSide.CREDIT,
          amount: 250,
        },
      ],
    };

    const first = await postJournal(masterAToken, key, body).expect(201);
    const second = await postJournal(masterAToken, key, body).expect(201);

    const firstJournal = first.body as JournalRecord;
    const secondJournal = second.body as JournalRecord;
    expect(secondJournal.id).toBe(firstJournal.id);
    expect(secondJournal.lines.map((line) => line.id).sort()).toEqual(
      firstJournal.lines.map((line) => line.id).sort(),
    );

    const beforeRetryBalance = (
      await http
        .get(`/ledger/balances/${clientA.id}`)
        .set('Authorization', `Bearer ${masterAToken}`)
        .expect(200)
    ).body as AccountBalance;

    const third = await postJournal(masterAToken, key, body).expect(201);
    expect((third.body as JournalRecord).id).toBe(firstJournal.id);

    const afterRetryBalance = (
      await http
        .get(`/ledger/balances/${clientA.id}`)
        .set('Authorization', `Bearer ${masterAToken}`)
        .expect(200)
    ).body as AccountBalance;
    expect(afterRetryBalance.balance).toBe(beforeRetryBalance.balance);
  });

  it('denies out-of-scope account access with 403', async () => {
    await postJournal(masterAToken, 'out-of-scope-post', {
      lines: [
        {
          accountUserId: masterA.id,
          side: LedgerSide.DEBIT,
          amount: 10,
        },
        {
          accountUserId: clientB.id,
          side: LedgerSide.CREDIT,
          amount: 10,
        },
      ],
    }).expect(403);

    await http
      .get(`/ledger/balances/${clientB.id}`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(403);

    await http
      .get(`/ledger/entries?accountUserId=${clientB.id}`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(403);
  });

  it('corrects only via reversal and keeps posted journals immutable', async () => {
    const posted = await postJournal(masterAToken, 'to-reverse-1', {
      lines: [
        {
          accountUserId: masterA.id,
          side: LedgerSide.DEBIT,
          amount: 75,
        },
        {
          accountUserId: clientA.id,
          side: LedgerSide.CREDIT,
          amount: 75,
        },
      ],
    }).expect(201);
    const journal = posted.body as JournalRecord;

    const before = (
      await http
        .get(`/ledger/balances/${clientA.id}`)
        .set('Authorization', `Bearer ${masterAToken}`)
        .expect(200)
    ).body as AccountBalance;

    const reversed = await http
      .post(`/ledger/journals/${journal.id}/reverse`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .set('Idempotency-Key', 'reverse-1')
      .expect(201);

    const reversal = reversed.body as JournalRecord;
    expect(reversal.reversalOfId).toBe(journal.id);
    expect(reversal.lines).toHaveLength(2);

    const after = (
      await http
        .get(`/ledger/balances/${clientA.id}`)
        .set('Authorization', `Bearer ${masterAToken}`)
        .expect(200)
    ).body as AccountBalance;
    expect(after.balance).toBe(before.balance - 75);

    const original = await postJournal(masterAToken, 'to-reverse-1', {
      lines: journal.lines.map((line) => ({
        accountUserId: line.accountUserId,
        side: line.side,
        amount: line.amount,
      })),
    }).expect(201);
    expect((original.body as JournalRecord).id).toBe(journal.id);
  });
});
