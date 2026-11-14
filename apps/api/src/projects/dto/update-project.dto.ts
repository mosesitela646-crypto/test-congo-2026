import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProjectDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(120)
  name?: string;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @IsOptional() @IsIn(["DRAFT", "ACTIVE", "ARCHIVED"])
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
}
