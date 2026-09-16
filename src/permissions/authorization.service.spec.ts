import { ForbiddenException } from '@nestjs/common';
import { Role } from '../users/user.types';
import { Permission } from './permissions';
import { AuthorizationService } from './authorization.service';

describe('AuthorizationService', () => {
  const authz = new AuthorizationService();

  it('allows Super Admin, Master, and Super Master to create users', () => {
    expect(authz.hasPermission(Role.SUPER_MASTER, Permission.USER_CREATE)).toBe(
      true,
    );
    expect(authz.hasPermission(Role.SUPER_ADMIN, Permission.USER_CREATE)).toBe(
      true,
    );
    expect(authz.hasPermission(Role.MASTER, Permission.USER_CREATE)).toBe(true);
  });

  it('does not let a Client post to the ledger', () => {
    expect(authz.hasPermission(Role.CLIENT, Permission.LEDGER_POST)).toBe(
      false,
    );
    expect(authz.hasPermission(Role.MASTER, Permission.LEDGER_POST)).toBe(true);
  });

  it('only allows creating the next role down the hierarchy', () => {
    expect(authz.canCreateRole(Role.SUPER_MASTER, Role.SUPER_ADMIN)).toBe(true);
    expect(authz.canCreateRole(Role.SUPER_ADMIN, Role.MASTER)).toBe(true);
    expect(authz.canCreateRole(Role.MASTER, Role.CLIENT)).toBe(true);
    expect(authz.canCreateRole(Role.MASTER, Role.SUPER_ADMIN)).toBe(false);
    expect(authz.canCreateRole(Role.CLIENT, Role.CLIENT)).toBe(false);
  });

  it('throws when a Master tries to create a Super Admin', () => {
    expect(() => authz.assertCanCreate(Role.MASTER, Role.SUPER_ADMIN)).toThrow(
      ForbiddenException,
    );
  });
});
