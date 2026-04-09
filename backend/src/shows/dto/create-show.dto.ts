import {
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateShowDto {
  @IsString()
  venueId: string;

  @IsNumber()
  tmdbMovieId: number;

  @IsString()
  movieTitle: string;

  @IsString()
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
  @IsOptional()
  price?: number;
}
