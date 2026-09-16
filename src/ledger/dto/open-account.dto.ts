import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { AccountCode } from '../ledger.types';

export class OpenAccountDto {
  @IsString()
  @MinLength(1)
  ownerUserId: string;

  @IsEnum(AccountCode)
  code: AccountCode;

  @IsOptional()
  @IsString()
  @MinLength(1)
  currency?: string;
}
