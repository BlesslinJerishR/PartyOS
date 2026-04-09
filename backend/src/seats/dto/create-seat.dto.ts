import { IsString, IsNumber, IsEnum, IsOptional, Min } from 'class-validator';
import { SeatType } from '@prisma/client';

export class CreateSeatDto {
  @IsString()
  venueId: string;

  @IsEnum(SeatType)
  type: SeatType;

  @IsString()
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
