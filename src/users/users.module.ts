import { Module } from '@nestjs/common';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { InMemoryUsersRepository } from './in-memory-users.repository';
import { PrismaUsersRepository } from './prisma-users.repository';
import { UsersController } from './users.controller';
import { USERS_REPOSITORY } from './users.repository';
import { UsersService } from './users.service';

@Module({
  imports: [HierarchyModule, PermissionsModule, PrismaModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: USERS_REPOSITORY,
      inject: [{ token: PrismaService, optional: true }],
      useFactory: (prisma?: PrismaService) => {
        if (process.env.DATABASE_URL && prisma) {
          return new PrismaUsersRepository(prisma);
        }
        return new InMemoryUsersRepository();
      },
    },
  ],
  exports: [UsersService],
})
export class UsersModule {}
