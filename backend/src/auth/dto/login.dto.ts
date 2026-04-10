import { IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(30)
  username: string;

  @IsString()
  @MaxLength(128)
  password: string;
}
