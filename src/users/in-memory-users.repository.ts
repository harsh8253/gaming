import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NewUserRecord, UserRecord } from './user.types';
import type { UsersRepository } from './users.repository';

@Injectable()
export class InMemoryUsersRepository implements UsersRepository {
  private readonly users = new Map<string, UserRecord>();

  findById(id: string): Promise<UserRecord | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByUsername(username: string): Promise<UserRecord | null> {
    return Promise.resolve(
      [...this.users.values()].find((user) => user.username === username) ??
        null,
    );
  }

  listAll(): Promise<UserRecord[]> {
    return Promise.resolve([...this.users.values()]);
  }

  create(input: NewUserRecord): Promise<UserRecord> {
    const now = new Date();
    const record: UserRecord = {
      id: randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(record.id, record);
    return Promise.resolve(record);
  }
}
