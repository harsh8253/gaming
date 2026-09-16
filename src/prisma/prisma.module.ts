import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [
    {
      provide: PrismaService,
      useFactory: () => {
        if (!process.env.DATABASE_URL) {
          return null;
        }
        return new PrismaService();
      },
    },
  ],
  exports: [PrismaService],
})
export class PrismaModule {}
