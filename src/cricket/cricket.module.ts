import { Module } from '@nestjs/common';
import { CricketController } from './cricket.controller';
import { SportradarClient } from './sportradar.client';

@Module({
  controllers: [CricketController],
  providers: [SportradarClient],
})
export class CricketModule {}
