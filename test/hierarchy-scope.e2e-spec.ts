import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request, { SuperTest, Test as SuperTestRequest } from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/configure-app';
import { PublicUser, Role } from '../src/users/user.types';

type LoginBody = { accessToken: string; user: PublicUser };

describe('S1 hierarchy scope isolation', () => {
  let app: INestApplication;
  let http: SuperTest<SuperTestRequest>;
  let masterAToken: string;
  let masterBToken: string;
  let masterB: PublicUser;
  let clientA: PublicUser;

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
    await createUser(rootToken, 'sa-alpha', Role.SUPER_ADMIN).expect(201);
    const saToken = await login('sa-alpha', password);
    await createUser(saToken, 'master-a', Role.MASTER).expect(201);
    await createUser(saToken, 'master-b', Role.MASTER).expect(201);

    masterAToken = await login('master-a', password);
    masterBToken = await login('master-b', password);
    masterB = await me(masterBToken);

    const clientResponse = await createUser(
      masterAToken,
      'client-a',
      Role.CLIENT,
    ).expect(201);
    clientA = clientResponse.body as PublicUser;
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(
    username: string,
    userPassword: string,
    extra: Record<string, unknown> = {},
  ): Promise<string> {
    const response = await http
      .post('/auth/login')
      .send({ username, password: userPassword, ...extra })
      .expect(200);
    return (response.body as LoginBody).accessToken;
  }

  function createUser(
    token: string,
    username: string,
    role: Role,
    extra: Record<string, unknown> = {},
  ) {
    return http
      .post('/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username, password, role, ...extra });
  }

  async function me(token: string): Promise<PublicUser> {
    const response = await http
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    return response.body as PublicUser;
  }

  it('resolves identity from the session token and ignores frontend-supplied ids on login', async () => {
    const spoofed = await http
      .post('/auth/login')
      .send({
        username: 'root',
        password: 'changeme',
        user_id: 'attacker-user',
        master_id: 'attacker-master',
        organization_id: 'org-other',
        role: Role.CLIENT,
      })
      .expect(200);

    const body = spoofed.body as LoginBody;
    expect(body.user.username).toBe('root');
    expect(body.user.role).toBe(Role.SUPER_MASTER);
    expect(body.user.organizationId).toBe('org-local');
    expect(body.user.id).not.toBe('attacker-user');

    const sessionUser = await me(body.accessToken);
    expect(sessionUser).toMatchObject({
      username: 'root',
      role: Role.SUPER_MASTER,
      organizationId: 'org-local',
    });
  });

  it('denies the same client to a Master who is not the parent', async () => {
    const ownerRead = await http
      .get(`/users/${clientA.id}`)
      .set('Authorization', `Bearer ${masterAToken}`)
      .expect(200);
    expect((ownerRead.body as PublicUser).username).toBe('client-a');

    await http
      .get(`/users/${clientA.id}`)
      .set('Authorization', `Bearer ${masterBToken}`)
      .expect(403);

    const masterBList = await http
      .get('/users')
      .set('Authorization', `Bearer ${masterBToken}`)
      .expect(200);
    const usernames = (masterBList.body as PublicUser[]).map(
      (user) => user.username,
    );
    expect(usernames).not.toContain('client-a');
  });

  it('ignores frontend-supplied user_id, master_id, parent_user_id, and organization_id', async () => {
    const created = await createUser(
      masterAToken,
      'client-spoofed',
      Role.CLIENT,
      {
        user_id: masterB.id,
        master_id: masterB.id,
        parent_user_id: masterB.id,
        parentUserId: masterB.id,
        organization_id: 'org-other',
        organizationId: 'org-other',
      },
    ).expect(201);

    const body = created.body as PublicUser;
    expect(body.username).toBe('client-spoofed');
    expect(body.role).toBe(Role.CLIENT);
    expect(body.organizationId).toBe('org-local');
    expect(body.parentUserId).not.toBe(masterB.id);

    const masterA = await me(masterAToken);
    expect(body.parentUserId).toBe(masterA.id);

    await http
      .get(`/users/${body.id}`)
      .set('Authorization', `Bearer ${masterBToken}`)
      .expect(403);
  });

  it('rejects role elevation instead of trusting a frontend-supplied role', async () => {
    await createUser(masterAToken, 'would-be-root', Role.SUPER_MASTER).expect(
      403,
    );
  });
});
