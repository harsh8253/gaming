import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { env } from '../env';
import { HierarchyService } from '../hierarchy/hierarchy.service';
import { AuthorizationService } from '../permissions/authorization.service';
import { Permission } from '../permissions/permissions';
import { CreateUserDto } from './dto/create-user.dto';
import { USERS_REPOSITORY, type UsersRepository } from './users.repository';
import { PublicUser, Role, toPublicUser, type UserRecord } from './user.types';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @Inject(USERS_REPOSITORY) private readonly users: UsersRepository,
    private readonly hierarchy: HierarchyService,
    private readonly authorization: AuthorizationService,
  ) {}

  async onModuleInit(): Promise<void> {
    const username = env('BOOTSTRAP_USERNAME', 'root');
    const existing = await this.users.findByUsername(username);
    if (existing) {
      return;
    }

    const password = env('BOOTSTRAP_PASSWORD', 'changeme');
    await this.users.create({
      username,
      passwordHash: await bcrypt.hash(password, 10),
      role: Role.SUPER_MASTER,
      parentUserId: null,
      organizationId: env('BOOTSTRAP_ORG_ID', 'org-local'),
    });
  }

  findById(id: string): Promise<UserRecord | null> {
    return this.users.findById(id);
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    return this.users.findByUsername(username);
  }

  async listInScope(actor: UserRecord): Promise<PublicUser[]> {
    this.authorization.assertPermission(actor.role, Permission.USER_LIST);
    const users = await this.users.listAll();
    return this.hierarchy.visibleUsers(actor, users).map(toPublicUser);
  }

  async getInScope(actor: UserRecord, id: string): Promise<PublicUser> {
    this.authorization.assertPermission(actor.role, Permission.USER_READ);
    const users = await this.users.listAll();
    const target = users.find((user) => user.id === id);
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (!this.hierarchy.isInScope(actor, target, users)) {
      throw new ForbiddenException('Resource is outside hierarchy scope');
    }
    return toPublicUser(target);
  }

  async createInScope(
    actor: UserRecord,
    dto: CreateUserDto,
  ): Promise<PublicUser> {
    this.authorization.assertPermission(actor.role, Permission.USER_CREATE);
    this.authorization.assertCanCreate(actor.role, dto.role);

    const taken = await this.users.findByUsername(dto.username);
    if (taken) {
      throw new ConflictException('Username already taken');
    }

    const created = await this.users.create({
      username: dto.username,
      passwordHash: await bcrypt.hash(dto.password, 10),
      role: dto.role,
      parentUserId: actor.id,
      organizationId: actor.organizationId,
    });
    return toPublicUser(created);
  }
}
