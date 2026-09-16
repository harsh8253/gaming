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
import { LedgerSide } from '../ledger.types';

export class JournalLineDto {
  @IsString()
  @MinLength(1)
  accountUserId: string;

  @IsEnum(LedgerSide)
  side: LedgerSide;

  @IsInt()
  @Min(1)
  amount: number;
}

export class PostJournalDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
