import { Module } from '@nestjs/common';
import { HierarchyModule } from '../hierarchy/hierarchy.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { InMemoryLedgerRepository } from './in-memory-ledger.repository';
import { LedgerController } from './ledger.controller';
import { LEDGER_REPOSITORY } from './ledger.repository';
import { LedgerService } from './ledger.service';
import { PrismaLedgerRepository } from './prisma-ledger.repository';

@Module({
  imports: [HierarchyModule, PermissionsModule, PrismaModule, UsersModule],
  controllers: [LedgerController],
  providers: [
    LedgerService,
    {
      provide: LEDGER_REPOSITORY,
      inject: [{ token: PrismaService, optional: true }],
      useFactory: (prisma?: PrismaService) => {
        if (process.env.DATABASE_URL && prisma) {
          return new PrismaLedgerRepository(prisma);
        }
        return new InMemoryLedgerRepository();
      },
    },
  ],
  exports: [LedgerService],
})
export class LedgerModule {}
