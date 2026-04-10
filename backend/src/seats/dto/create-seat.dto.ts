import { IsString, IsNumber, IsEnum, IsOptional, Min, MaxLength, IsUUID } from 'class-validator';
import { SeatType } from '@prisma/client';

export class CreateSeatDto {
  @IsUUID()
  venueId: string;

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
