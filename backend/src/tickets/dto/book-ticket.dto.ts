import { IsString } from 'class-validator';

export class BookTicketDto {
  @IsString()
  showId: string;

  @IsString()
  seatId: string;
}
