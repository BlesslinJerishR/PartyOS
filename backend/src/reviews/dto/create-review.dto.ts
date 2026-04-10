import { IsString, IsNumber, IsOptional, Min, Max, MaxLength, IsUUID, IsInt } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  ticketId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  comment?: string;
}
