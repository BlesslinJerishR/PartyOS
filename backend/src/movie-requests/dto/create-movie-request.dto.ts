import { IsString, IsNumber, IsUUID, Min, MaxLength, MinLength } from 'class-validator';

export class CreateMovieRequestDto {
  @IsUUID()
  hostId: string;

  @IsNumber()
  @Min(1)
  tmdbMovieId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  movieTitle: string;
}
