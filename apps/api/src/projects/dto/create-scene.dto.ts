import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateSceneDto {
  @IsString() @MinLength(2) @MaxLength(160)
  title!: string;

  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @IsInt() @Min(1)
  order!: number;

  @IsOptional() @IsString()
  episodeId?: string;
}