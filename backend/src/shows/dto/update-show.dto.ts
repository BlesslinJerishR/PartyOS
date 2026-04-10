import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ShowStatus } from '@prisma/client';

export class UpdateShowDto {
  @IsNumber()
  @IsOptional()
  tmdbMovieId?: number;

  @IsString()
  @IsOptional()
  movieTitle?: string;

  @IsString()
  @IsOptional()
  moviePoster?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsBoolean()
  @IsOptional()
  isFree?: boolean;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsEnum(ShowStatus)
  @IsOptional()
  status?: ShowStatus;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @IsOptional()
  password?: string;
}
