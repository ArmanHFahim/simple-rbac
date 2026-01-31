import { Get, Body, Post, Param, Patch, Query, Delete, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { AuthUser } from '@common/types';
import { ClientIp, CurrentUser, RequirePermissions } from '@common/decorators';

import { DocumentsQueryDto, documentsQuerySchema, CreateDocumentDto, UpdateDocumentDto, createDocumentSchema, updateDocumentSchema } from '@documents/dto/documents.dto';

import { DocumentsService } from '@documents/documents.service';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  @Get()
  @RequirePermissions('documents:read')
  async findAll(
    @CurrentUser() currentUser: AuthUser,
    @Query(zodPipe(documentsQuerySchema)) query: DocumentsQueryDto,
  ) {
    return this.documentsService.findAll(query, currentUser);
  }

  @Get(':id')
  @RequirePermissions('documents:read')
  async findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Get(':id/export')
  @RequirePermissions('documents:export')
  async exportDocument(@Param('id') id: string) {
    return this.documentsService.exportDocument(id);
  }

  @Post()
  @RequirePermissions('documents:create')
  async create(
    @Body(zodPipe(createDocumentSchema)) dto: CreateDocumentDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.documentsService.create(dto, currentUser, clientIp);
  }

  @Patch(':id')
  @RequirePermissions('documents:update')
  async update(
    @Param('id') id: string,
    @Body(zodPipe(updateDocumentSchema)) dto: UpdateDocumentDto,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.documentsService.update(id, dto, currentUser, clientIp);
  }

  @Delete(':id')
  @RequirePermissions('documents:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthUser,
    @ClientIp() clientIp: string,
  ) {
    return this.documentsService.delete(id, currentUser, clientIp);
  }
}
