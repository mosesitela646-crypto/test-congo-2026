import { Module } from "@nestjs/common";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProjectsModule } from "./projects/projects.module";

@Module({ imports: [PrismaModule, HealthModule, ProjectsModule] })
export class AppModule {}
