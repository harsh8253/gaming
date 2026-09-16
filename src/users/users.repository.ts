import { NewUserRecord, UserRecord } from './user.types';

export const USERS_REPOSITORY = Symbol('USERS_REPOSITORY');

export interface UsersRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  listAll(): Promise<UserRecord[]>;
  create(input: NewUserRecord): Promise<UserRecord>;
}
