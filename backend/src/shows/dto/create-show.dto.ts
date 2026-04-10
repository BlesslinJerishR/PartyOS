import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsUUID,
  Min,
  Max,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateShowDto {
  @IsUUID()
  venueId: string;

  @IsNumber()
  @Min(1)
  tmdbMovieId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  movieTitle: string;

  @IsString()
  @MaxLength(500)
  @IsOptional()
  moviePoster?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

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
  @ValidateIf((o) => o.isPrivate === true)
  @IsOptional()
  password?: string;
}
