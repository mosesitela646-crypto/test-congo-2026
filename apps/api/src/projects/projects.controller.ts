import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateCharacterProfileDto } from "./dto/update-character-profile.dto";
import { Prisma } from "@prisma/client";

@Controller("projects")
export class ProjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.prisma.project.create({ data: dto });
  }

  @Get()
  findAll(@Query("page", new ParseIntPipe({ optional: true })) page = 1,
         @Query("limit", new ParseIntPipe({ optional: true })) limit = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    return this.prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit
    });
  }

  @Get(":id/characters")
  async findCharacters(@Param("id") id: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) throw new NotFoundException("Project not found");
    return this.prisma.character.findMany({
      where: { projectId: id },
      include: { references: { orderBy: { version: "desc" } } },
      orderBy: { createdAt: "asc" }
    });
  }

  @Post(":id/characters")
  async createCharacter(@Param("id") id: string, @Body() dto: CreateCharacterDto) {
    const project = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!project) throw new NotFoundException("Project not found");
    return this.prisma.character.create({
      data: { projectId: id, name: dto.name, description: dto.description }
    });
  }

  @Patch(":id/characters/:characterId/profile")
  async updateCharacterProfile(
    @Param("id") projectId: string,
    @Param("characterId") characterId: string,
    @Body() dto: UpdateCharacterProfileDto
  ) {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, projectId },
      select: { id: true }
    });
    if (!character) throw new NotFoundException("Character not found in this project");

    return this.prisma.character.update({
      where: { id: characterId },
      data: { canonicalProfile: dto as Prisma.InputJsonObject }
    });
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { _count: { select: { seasons: true, episodes: true, scenes: true, characters: true, assets: true } } }
    });
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateProjectDto) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Project not found");
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } });
    if (!exists) throw new NotFoundException("Project not found");
    await this.prisma.project.delete({ where: { id } });
  }
}
