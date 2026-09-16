import { Injectable } from '@nestjs/common';
import { Role, type UserRecord } from '../users/user.types';

@Injectable()
export class HierarchyService {
  isInScope(
    actor: UserRecord,
    target: UserRecord,
    users: UserRecord[],
  ): boolean {
    if (actor.id === target.id) {
      return true;
    }
    if (actor.organizationId !== target.organizationId) {
      return false;
    }

    switch (actor.role) {
      case Role.SUPER_MASTER:
        return true;
      case Role.SUPER_ADMIN:
        return this.isAncestor(actor.id, target, users);
      case Role.MASTER:
        return target.parentUserId === actor.id && target.role === Role.CLIENT;
      case Role.CLIENT:
        return false;
    }
  }

  visibleUsers(actor: UserRecord, users: UserRecord[]): UserRecord[] {
    return users.filter((candidate) => this.isInScope(actor, candidate, users));
  }

  private isAncestor(
    actorId: string,
    target: UserRecord,
    users: UserRecord[],
  ): boolean {
    const byId = new Map(users.map((user) => [user.id, user]));
    let current: UserRecord | undefined = target;
    const seen = new Set<string>();

    while (current?.parentUserId) {
      if (seen.has(current.id)) {
        return false;
      }
      seen.add(current.id);
      if (current.parentUserId === actorId) {
        return true;
      }
      current = byId.get(current.parentUserId);
    }

    return false;
  }
}
