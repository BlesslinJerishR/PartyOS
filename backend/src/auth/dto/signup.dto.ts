import { IsString, MinLength, MaxLength } from 'class-validator';

export class SignupDto {
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password: string;
}
