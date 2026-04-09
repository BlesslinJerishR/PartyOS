import { IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class SetRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}
