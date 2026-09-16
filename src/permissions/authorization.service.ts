import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role } from '../users/user.types';
import { Permission } from './permissions';

const LEDGER_WRITE = [
  Permission.ACCOUNT_OPEN,
  Permission.ACCOUNT_READ,
  Permission.LEDGER_POST,
  Permission.LEDGER_READ,
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_MASTER]: [
    Permission.USER_CREATE,
    Permission.USER_LIST,
    Permission.USER_READ,
    ...LEDGER_WRITE,
  ],
  [Role.SUPER_ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_LIST,
    Permission.USER_READ,
    ...LEDGER_WRITE,
  ],
  [Role.MASTER]: [
    Permission.USER_CREATE,
    Permission.USER_LIST,
    Permission.USER_READ,
    ...LEDGER_WRITE,
  ],
  [Role.CLIENT]: [
    Permission.USER_LIST,
    Permission.USER_READ,
    Permission.ACCOUNT_READ,
    Permission.LEDGER_READ,
  ],
};

const CREATABLE_ROLES: Record<Role, Role[]> = {
  [Role.SUPER_MASTER]: [Role.SUPER_ADMIN],
  [Role.SUPER_ADMIN]: [Role.MASTER],
  [Role.MASTER]: [Role.CLIENT],
  [Role.CLIENT]: [],
};

@Injectable()
export class AuthorizationService {
  hasPermission(role: Role, permission: Permission): boolean {
    return ROLE_PERMISSIONS[role].includes(permission);
  }

  canCreateRole(actorRole: Role, newRole: Role): boolean {
    return CREATABLE_ROLES[actorRole].includes(newRole);
  }

  assertPermission(role: Role, permission: Permission): void {
    if (!this.hasPermission(role, permission)) {
      throw new ForbiddenException('Missing permission');
    }
  }

  assertCanCreate(actorRole: Role, newRole: Role): void {
    if (!this.canCreateRole(actorRole, newRole)) {
      throw new ForbiddenException('Cannot create a user with that role');
    }
  }
}
