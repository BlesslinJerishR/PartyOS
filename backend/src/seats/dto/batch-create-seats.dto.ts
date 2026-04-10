import { IsString, IsArray, ValidateNested, IsEnum, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { SeatType } from '@prisma/client';
import { IsUUID } from 'class-validator';

class SeatItem {
  @IsEnum(SeatType)
  type: SeatType;

  @IsString()
  @MaxLength(20)
  label: string;

  @IsNumber()
  @Min(0)
  row: number;

  @IsNumber()
  @Min(0)
  col: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  capacity?: number;
}

export class BatchCreateSeatsDto {
  @IsUUID()
  venueId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatItem)
  seats: SeatItem[];
}
