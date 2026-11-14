import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UploadedFile, UseInterceptors, StreamableFile } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { CreateCharacterDto } from "./dto/create-character.dto";
import { UpdateCharacterProfileDto } from "./dto/update-character-profile.dto";
import { Prisma, AssetType } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";
import { createReadStream, existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import { randomUUID } from "node:crypto";

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
      include: { references: { include: { asset: true }, orderBy: { version: "desc" } } },
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
      data: { canonicalProfile: dto as unknown as Prisma.InputJsonObject }
    });
  }


  @Post(":id/characters/:characterId/references")
  @UseInterceptors(FileInterceptor("file", {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (_req, file, callback) => {
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.mimetype)) return callback(new BadRequestException("Only JPG, PNG and WebP images are allowed."), false);
      callback(null, true);
    }
  }))
  async uploadCharacterReference(
    @Param("id") projectId: string,
    @Param("characterId") characterId: string,
    @UploadedFile() file: any
  ) {
    if (!file) throw new BadRequestException("Choose an image file (JPG, PNG or WebP).");
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, projectId }, select: { id: true, name: true }
    });
    if (!character) throw new NotFoundException("Character not found in this project.");

    const extensionByMime: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
    const filename = `${randomUUID()}${extensionByMime[file.mimetype]}`;
    const directory = path.resolve(process.cwd(), "apps/api/uploads/characters");
    mkdirSync(directory, { recursive: true });
    writeFileSync(path.join(directory, filename), file.buffer);

    const latest = await this.prisma.characterReference.aggregate({
      where: { characterId }, _max: { version: true }
    });
    const version = (latest._max.version || 0) + 1;
    const isFirst = version === 1;
    const asset = await this.prisma.asset.create({
      data: {
        name: `${character.name} reference v${version}`,
        type: AssetType.IMAGE,
        mimeType: file.mimetype,
        storageKey: filename,
        projectId,
        metadata: { originalName: file.originalname, size: file.size, category: "character-reference" }
      }
    });
    const reference = await this.prisma.characterReference.create({
      data: {
        characterId, assetId: asset.id, version,
        label: isFirst ? "MASTER_REFERENCE" : "VISUAL_REFERENCE",
        description: isFirst ? "Initial master visual reference" : "Additional visual reference"
      },
      include: { asset: true }
    });
    return { ...reference, isMaster: isFirst, fileUrl: `/api/projects/${projectId}/assets/${asset.id}/file` };
  }

  @Patch(":id/characters/:characterId/references/:referenceId/master")
  async setMasterCharacterReference(
    @Param("id") projectId: string,
    @Param("characterId") characterId: string,
    @Param("referenceId") referenceId: string
  ) {
    const reference = await this.prisma.characterReference.findFirst({
      where: { id: referenceId, characterId, character: { projectId } },
      select: { id: true }
    });
    if (!reference) throw new NotFoundException("Character reference not found in this project.");
    await this.prisma.$transaction([
      this.prisma.characterReference.updateMany({
        where: { characterId }, data: { label: "VISUAL_REFERENCE" }
      }),
      this.prisma.characterReference.update({
        where: { id: referenceId }, data: { label: "MASTER_REFERENCE" }
      })
    ]);
    return { success: true, masterReferenceId: referenceId };
  }


  @Get(":id/characters/:characterId/consistency-kit")
  async getCharacterConsistencyKit(
    @Param("id") projectId: string,
    @Param("characterId") characterId: string,
    @Query("scene") scene = "",
    @Query("outfit") outfit = "",
    @Query("action") action = "",
    @Query("environment") environment = "",
    @Query("camera") camera = "",
    @Query("style") style = ""
  ) {
    const character = await this.prisma.character.findFirst({
      where: { id: characterId, projectId },
      include: { references: { include: { asset: true }, orderBy: { version: "asc" } } }
    });
    if (!character) throw new NotFoundException("Character not found in this project.");

    const profile = (character.canonicalProfile || {}) as Record<string, unknown>;
    const master = character.references.find(reference => reference.label === "MASTER_REFERENCE");
    const references = character.references.filter(reference => reference.asset).map(reference => ({
      id: reference.id,
      version: reference.version,
      label: reference.label,
      url: `/api/projects/${projectId}/assets/${reference.asset!.id}/file`
    }));
    const traits: [string, unknown][] = [
      ["Role", profile.role], ["Age", profile.age], ["Skin tone", profile.skinTone],
      ["Face", profile.face], ["Eyes", profile.eyes], ["Hair", profile.hair],
      ["Body build", profile.build], ["Distinctive features", profile.distinguishingFeatures],
      ["Personality", profile.personality]
    ];
    const identity = traits.flatMap(([label, value]) =>
      typeof value === "string" && value.trim().length > 0 ? [`- ${label}: ${value}`] : []
    );
    const continuity = typeof profile.consistencyNotes === "string" ? profile.consistencyNotes : "";
    const signatureOutfit = typeof profile.defaultOutfit === "string" ? profile.defaultOutfit : "";
    const prompt = [
      `Create a cinematic image featuring the established character "${character.name}".`,
      character.description ? `Character summary: ${character.description}` : "",
      identity.length ? `CANONICAL IDENTITY (keep stable):\n${identity.join("\n")}` : "",
      master ? "Use the attached MASTER REFERENCE as the primary identity source. Preserve the same recognizable face, facial proportions, skin tone, eye color, hair and body proportions. Do not redesign the character." : "No master image is registered; follow the canonical identity description.",
      references.length > 1 ? `There are ${references.length - 1} additional visual references for this same character.` : "",
      signatureOutfit ? `Signature outfit: ${signatureOutfit}` : "",
      outfit.trim() ? `SCENE OUTFIT (may differ from signature outfit): ${outfit.trim()}` : "",
      scene.trim() ? `SCENE: ${scene.trim()}` : "",
      action.trim() ? `ACTION / EXPRESSION: ${action.trim()}` : "",
      environment.trim() ? `ENVIRONMENT: ${environment.trim()}` : "",
      camera.trim() ? `CAMERA / COMPOSITION: ${camera.trim()}` : "",
      style.trim() ? `VISUAL STYLE: ${style.trim()}` : "",
      continuity ? `CONTINUITY RULES: ${continuity}` : "",
      "Only change details explicitly requested for this scene. Do not alter the character's identity, age, facial features, eye color, skin tone, hairstyle or distinctive marks."
    ].filter(Boolean).join("\n\n");

    return {
      character: { id: character.id, name: character.name },
      masterReference: master?.asset ? { version: master.version, url: `/api/projects/${projectId}/assets/${master.asset.id}/file` } : null,
      references,
      sceneInputs: { scene, outfit, action, environment, camera, style },
      prompt,
      status: "PROMPT_PACKAGE_ONLY",
      note: "This prepares a prompt and reference URLs. It does not yet submit images to an image-generation model."
    };
  }

  @Get(":id/assets/:assetId/file")
  async getProjectAssetFile(
    @Param("id") projectId: string,
    @Param("assetId") assetId: string
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, projectId, type: AssetType.IMAGE }
    });
    if (!asset) throw new NotFoundException("Image asset not found.");
    const directory = path.resolve(process.cwd(), "apps/api/uploads/characters");
    const filePath = path.resolve(directory, path.basename(asset.storageKey));
    if (!filePath.startsWith(directory + path.sep) || !existsSync(filePath)) {
      throw new NotFoundException("Image file is missing from local storage.");
    }
    return new StreamableFile(createReadStream(filePath), {
      type: asset.mimeType || "application/octet-stream",
      disposition: `inline; filename="${path.basename(filePath)}"`
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
