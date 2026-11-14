import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateCharacterDto {
  @IsString() @MinLength(2) @MaxLength(100)
  name!: string;

  @IsOptional() @IsString() @MaxLength(3000)
  description?: string;
}