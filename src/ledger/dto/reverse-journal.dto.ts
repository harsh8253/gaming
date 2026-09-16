import { IsString, MinLength } from 'class-validator';

export class ReverseJournalDto {
  @IsString()
  @MinLength(1)
  idempotencyKey: string;

  @IsString()
  @MinLength(1)
  sourceEventId: string;
}
