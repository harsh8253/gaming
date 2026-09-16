import { Injectable } from '@nestjs/common';
import { Role as PrismaRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NewUserRecord, Role, type UserRecord } from './user.types';
import type { UsersRepository } from './users.repository';

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? this.toRecord(row) : null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const row = await this.prisma.user.findUnique({ where: { username } });
    return row ? this.toRecord(row) : null;
  }

  async listAll(): Promise<UserRecord[]> {
    const rows = await this.prisma.user.findMany();
    return rows.map((row) => this.toRecord(row));
  }

  async create(input: NewUserRecord): Promise<UserRecord> {
    const row = await this.prisma.user.create({
      data: {
        username: input.username,
        passwordHash: input.passwordHash,
        role: input.role,
        parentUserId: input.parentUserId,
        organizationId: input.organizationId,
      },
    });
    return this.toRecord(row);
  }

  private toRecord(row: {
    id: string;
    username: string;
    passwordHash: string;
    role: PrismaRole;
    parentUserId: string | null;
    organizationId: string;
    createdAt: Date;
    updatedAt: Date;
  }): UserRecord {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.passwordHash,
      role: Role[row.role],
      parentUserId: row.parentUserId,
      organizationId: row.organizationId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
