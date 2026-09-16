import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { EntryDirection } from '../ledger-math';

export class JournalEntryDto {
  @IsString()
  @MinLength(1)
  accountId: string;

  @IsEnum(EntryDirection)
  direction: EntryDirection;

  @IsInt()
  @Min(1)
  amountMinor: number;
}

export class PostJournalDto {
  @IsString()
  @MinLength(1)
  idempotencyKey: string;

  @IsString()
  @MinLength(1)
  sourceEventType: string;

  @IsString()
  @MinLength(1)
  sourceEventId: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalEntryDto)
  entries: JournalEntryDto[];
}
