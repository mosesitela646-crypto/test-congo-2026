import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateCharacterProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  role?: string;

  @IsOptional() @IsString() @MaxLength(80)
  age?: string;

  @IsOptional() @IsString() @MaxLength(120)
  skinTone?: string;

  @IsOptional() @IsString() @MaxLength(300)
  face?: string;

  @IsOptional() @IsString() @MaxLength(120)
  eyes?: string;

  @IsOptional() @IsString() @MaxLength(180)
  hair?: string;

  @IsOptional() @IsString() @MaxLength(180)
  build?: string;

  @IsOptional() @IsString() @MaxLength(500)
  distinguishingFeatures?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  personality?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  defaultOutfit?: string;

  @IsOptional() @IsString() @MaxLength(1000)
  voiceDescription?: string;

  @IsOptional() @IsString() @MaxLength(1500)
  consistencyNotes?: string;
}