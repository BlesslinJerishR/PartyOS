import { IsString, IsNumber } from 'class-validator';

export class CreateMovieRequestDto {
  @IsString()
  hostId: string;

  @IsNumber()
  tmdbMovieId: number;

  @IsString()
  movieTitle: string;
}
