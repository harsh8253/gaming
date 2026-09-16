export enum Role {
  SUPER_MASTER = 'SUPER_MASTER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  MASTER = 'MASTER',
  CLIENT = 'CLIENT',
}

export type UserRecord = {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  parentUserId: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NewUserRecord = Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'>;

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    parentUserId: user.parentUserId,
    organizationId: user.organizationId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
