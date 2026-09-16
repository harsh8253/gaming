import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { SuperTest, Test as SuperTestRequest } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { AccountCode } from '../src/ledger/ledger.types';
import { EntryDirection } from '../src/ledger/ledger-math';
import { PublicUser, Role } from '../src/users/user.types';

type LoginBody = { accessToken: string; user: PublicUser };
type AccountBody = {
  id: string;
  ownerUserId: string;
  code: string;
  type: string;
};
type TransactionBody = {
  id: string;
  idempotencyKey: string;
  sourceEventType: string;
  sourceEventId: string;
  entries: Array<{
    id: string;
    accountId: string;
    direction: string;
    amountMinor: number;
    sourceEventType: string;
    sourceEventId: string;
  }>;
};
type PositionBody = { accountId: string; positionMinor: number };

describe('S2 ledger invariants', () => {
  let app: INestApplication;
  let http: SuperTest<SuperTestRequest>;
  let masterAToken: string;
  let masterBToken: string;
  let clientA: PublicUser;
  let cashAccount: AccountBody;
  let walletAccount: AccountBody;

  const password = 'password12';
  const amount = 1000;
  const idempotencyKey = 'cash-in-client-a-001';
  const sourceEventId = 'evt-cash-in-001';

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

    const clientResponse = await createUser(
      masterAToken,
      'client-ledger-a',
      Role.CLIENT,
    ).expect(201);
    clientA = clientResponse.body as PublicUser;
    const masterA = await me(masterAToken);

    cashAccount = (
      await openAccount(masterAToken, {
        ownerUserId: masterA.id,
        code: AccountCode.CASH,
      }).expect(201)
    ).body as AccountBody;

    walletAccount = (
      await openAccount(masterAToken, {
        ownerUserId: clientA.id,
        code: AccountCode.WALLET,
      }).expect(201)
    ).body as AccountBody;
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(username: string, userPassword: string): Promise<string> {
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

  function openAccount(
    token: string,
    body: { ownerUserId: string; code: string },
  ) {
    return http
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  function postJournal(
    token: string,
    body: Record<string, unknown>,
  ) {
    return http
      .post('/ledger/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
  }

  it('posts a balanced cash-in journal and stores an immutable source event on entries', async () => {
    const posted = await postJournal(masterAToken, {
      idempotencyKey,
      sourceEventType: 'CASH_IN',
      sourceEventId,
      description: 'Client cash in',
      entries: [
        {
          accountId: cashAccount.id,
          direction: EntryDirection.DEBIT,
          amountMinor: amount,
        },
        {
          accountId: walletAccount.id,
          direction: EntryDirection.CREDIT,
          amountMinor: amount,
        },
      ],
    }).expect(201);

    const body = posted.body as TransactionBody;
    const debit = body.entries.reduce(
      (sum, entry) =>
        entry.direction === EntryDirection.DEBIT ? sum + entry.amountMinor : sum,
      0,
    );
    const credit = body.entries.reduce(
      (sum, entry) =>
        entry.direction === EntryDirection.CREDIT
          ? sum + entry.amountMinor
          : sum,
      0,
    );
    expect(debit).toBe(credit);
    expect(debit).toBe(amount);
    for (const entry of body.entries) {
      expect(entry.sourceEventType).toBe('CASH_IN');
      expect(entry.sourceEventId).toBe(sourceEventId);
    }
  });

  it('rejects an unbalanced post', async () => {
    await postJournal(masterAToken, {
      idempotencyKey: 'unbalanced-001',
      sourceEventType: 'CASH_IN',
      sourceEventId: 'evt-unbalanced',
      entries: [
        {
          accountId: cashAccount.id,
          direction: EntryDirection.DEBIT,
          amountMinor: amount,
        },
        {
          accountId: walletAccount.id,
          direction: EntryDirection.CREDIT,
          amountMinor: amount - 1,
        },
      ],
    }).expect(400);
  });

  it('derives position from ledger entries only', async () => {
    const cashPosition = await http
      .get(`/accounts/${cashAccount.id}/position`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    const walletPosition = await http
      .get(`/accounts/${walletAccount.id}/position`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);

    expect((cashPosition.body as PositionBody).positionMinor).toBe(amount);
    expect((walletPosition.body as PositionBody).positionMinor).toBe(amount);

    const statement = await http
      .get(`/accounts/${walletAccount.id}/statement`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    const lines = (
      statement.body as {
        positionMinor: number;
        entries: Array<{ amountMinor: number; direction: string }>;
      }
    ).entries;
    const fromEntries = lines.reduce((sum, line) => {
      return line.direction === EntryDirection.CREDIT
        ? sum + line.amountMinor
        : sum - line.amountMinor;
    }, 0);
    expect(fromEntries).toBe(
      (statement.body as { positionMinor: number }).positionMinor,
    );
    expect(fromEntries).toBe(amount);

    const profile = await me(masterAToken);
    expect(profile).not.toHaveProperty('balance');
  });

  it('denies a Master who is not in the owner hierarchy', async () => {
    await http
      .get(`/accounts/${walletAccount.id}/position`)
      .set('Authorization', `Bearer ${masterBToken}`)
      .expect(403);

    await postJournal(masterBToken, {
      idempotencyKey: 'master-b-raid',
      sourceEventType: 'TRANSFER',
      sourceEventId: 'evt-raid',
      entries: [
        {
          accountId: walletAccount.id,
          direction: EntryDirection.DEBIT,
          amountMinor: 100,
        },
        {
          accountId: cashAccount.id,
          direction: EntryDirection.CREDIT,
          amountMinor: 100,
        },
      ],
    }).expect(403);
  });

  it('returns the original transaction when the same idempotency key is retried', async () => {
    const first = await postJournal(masterAToken, {
      idempotencyKey,
      sourceEventType: 'CASH_IN',
      sourceEventId,
      entries: [
        {
          accountId: cashAccount.id,
          direction: EntryDirection.DEBIT,
          amountMinor: amount,
        },
        {
          accountId: walletAccount.id,
          direction: EntryDirection.CREDIT,
          amountMinor: amount,
        },
      ],
    }).expect(200);

    const replay = first.body as TransactionBody;
    expect(replay.idempotencyKey).toBe(idempotencyKey);
    expect(replay.entries).toHaveLength(2);

    const walletPosition = await http
      .get(`/accounts/${walletAccount.id}/position`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    expect((walletPosition.body as PositionBody).positionMinor).toBe(amount);
  });

  it('corrects via reversal without editing historical entries', async () => {
    const original = await postJournal(masterAToken, {
      idempotencyKey: 'cash-in-to-reverse',
      sourceEventType: 'CASH_IN',
      sourceEventId: 'evt-reverse-me',
      entries: [
        {
          accountId: cashAccount.id,
          direction: EntryDirection.DEBIT,
          amountMinor: 250,
        },
        {
          accountId: walletAccount.id,
          direction: EntryDirection.CREDIT,
          amountMinor: 250,
        },
      ],
    }).expect(201);

    const originalId = (original.body as TransactionBody).id;
    const originalEntryIds = (original.body as TransactionBody).entries.map(
      (entry) => entry.id,
    );

    const reversal = await http
      .post(`/ledger/transactions/${originalId}/reverse`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .send({
        idempotencyKey: 'reverse-cash-in-to-reverse',
        sourceEventId: 'evt-reversal-001',
      })
      .expect(201);

    const reversalBody = reversal.body as TransactionBody;
    expect(reversalBody.id).not.toBe(originalId);
    expect(reversalBody.sourceEventType).toBe('REVERSAL');
    expect(reversalBody.entries.map((entry) => entry.id)).not.toEqual(
      expect.arrayContaining(originalEntryIds),
    );

    const reread = await http
      .get(`/ledger/transactions/${originalId}`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    expect((reread.body as TransactionBody).entries.map((entry) => entry.id)).toEqual(
      originalEntryIds,
    );

    const walletPosition = await http
      .get(`/accounts/${walletAccount.id}/position`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    expect((walletPosition.body as PositionBody).positionMinor).toBe(amount);
  });
});
