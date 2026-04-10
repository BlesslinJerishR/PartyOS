import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateShowDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  tmdbMovieId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @IsOptional()
  movieTitle?: string;

  @IsString()
  @MaxLength(500)
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
  @Min(0)
  @Max(100000)
  @IsOptional()
  price?: number;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;

  @IsString()
  @MinLength(4)
  @MaxLength(128)
  @IsOptional()
  password?: string;
}
