import { IsString, IsOptional } from 'class-validator';

export class BookTicketDto {
  @IsString()
  showId: string;

  @IsString()
  seatId: string;

  @IsString()
  @IsOptional()
  password?: string;
}
