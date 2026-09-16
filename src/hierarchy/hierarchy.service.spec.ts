import { HierarchyService } from './hierarchy.service';
import { Role, type UserRecord } from '../users/user.types';

function user(
  partial: Pick<UserRecord, 'id' | 'role'> & Partial<UserRecord>,
): UserRecord {
  return {
    username: partial.username ?? partial.id,
    passwordHash: 'hash',
    parentUserId: partial.parentUserId ?? null,
    organizationId: partial.organizationId ?? 'org-a',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...partial,
  };
}

describe('HierarchyService', () => {
  const hierarchy = new HierarchyService();

  const superMaster = user({
    id: 'sm',
    role: Role.SUPER_MASTER,
    parentUserId: null,
  });
  const superAdmin = user({
    id: 'sa1',
    role: Role.SUPER_ADMIN,
    parentUserId: 'sm',
  });
  const master1 = user({
    id: 'm1',
    role: Role.MASTER,
    parentUserId: 'sa1',
  });
  const master2 = user({
    id: 'm2',
    role: Role.MASTER,
    parentUserId: 'sa1',
  });
  const client1 = user({
    id: 'c1',
    role: Role.CLIENT,
    parentUserId: 'm1',
  });
  const client2 = user({
    id: 'c2',
    role: Role.CLIENT,
    parentUserId: 'm2',
  });
  const otherOrgAdmin = user({
    id: 'sa-b',
    role: Role.SUPER_ADMIN,
    parentUserId: 'sm-b',
    organizationId: 'org-b',
  });

  const users = [
    superMaster,
    superAdmin,
    master1,
    master2,
    client1,
    client2,
    otherOrgAdmin,
  ];

  it('lets Super Master access anyone in the same organization', () => {
    expect(hierarchy.isInScope(superMaster, client2, users)).toBe(true);
    expect(hierarchy.isInScope(superMaster, otherOrgAdmin, users)).toBe(false);
  });

  it('lets Super Admin access only their own subtree', () => {
    expect(hierarchy.isInScope(superAdmin, master1, users)).toBe(true);
    expect(hierarchy.isInScope(superAdmin, client1, users)).toBe(true);
    expect(hierarchy.isInScope(superAdmin, otherOrgAdmin, users)).toBe(false);
  });

  it('lets Master access own clients and denies the same client to a wrong parent', () => {
    expect(hierarchy.isInScope(master1, client1, users)).toBe(true);
    expect(hierarchy.isInScope(master2, client1, users)).toBe(false);
  });

  it('lets Client access only self', () => {
    expect(hierarchy.isInScope(client1, client1, users)).toBe(true);
    expect(hierarchy.isInScope(client1, client2, users)).toBe(false);
    expect(hierarchy.isInScope(client1, master1, users)).toBe(false);
  });
});
