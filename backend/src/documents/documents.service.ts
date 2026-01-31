import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Project, Document } from '@entities';

import { AuthUser, PaginationParams } from '@common/types';

import { CreateDocumentDto, UpdateDocumentDto } from '@documents/dto/documents.dto';

import { AuditService } from '@audit/audit.service';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly auditService: AuditService,
  ) { }

  async findAll(
    params: PaginationParams & { projectId?: string },
    currentUser: AuthUser,
  ) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      projectId,
    } = params;

    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.project', 'project')
      .leftJoinAndSelect('project.team', 'team')
      .leftJoinAndSelect('document.createdBy', 'createdBy');

    if (currentUser.role.scope === 'team') {
      queryBuilder.where('team.id IN (:...teamIds)', {
        teamIds: currentUser.teamIds.length ? currentUser.teamIds : [''],
      });
    }

    if (projectId) {
      queryBuilder.andWhere('document.projectId = :projectId', { projectId });
    }

    queryBuilder
      .orderBy(`document.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
      relations: ['project', 'project.team', 'createdBy'],
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    return document;
  }

  async create(dto: CreateDocumentDto, currentUser: AuthUser, clientIp?: string) {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const document = this.documentRepository.create({
      title: dto.title,
      content: dto.content,
      projectId: dto.projectId,
      createdById: currentUser.id,
    });

    const savedDocument = await this.documentRepository.save(document);

    await this.auditService.log({
      user: currentUser,
      action: 'CREATE',
      resourceType: 'documents',
      resourceId: savedDocument.id,
      newValues: { title: savedDocument.title, projectId: savedDocument.projectId },
      ipAddress: clientIp,
    });

    return this.findOne(savedDocument.id);
  }

  async update(id: string, dto: UpdateDocumentDto, currentUser: AuthUser, clientIp?: string) {
    const document = await this.findOne(id);
    const oldValues = { title: document.title };

    if (dto.title) document.title = dto.title;
    if (dto.content !== undefined) document.content = dto.content;

    const savedDocument = await this.documentRepository.save(document);

    await this.auditService.log({
      user: currentUser,
      action: 'UPDATE',
      resourceType: 'documents',
      resourceId: id,
      oldValues,
      newValues: { title: savedDocument.title },
      ipAddress: clientIp,
    });

    return this.findOne(id);
  }

  async delete(id: string, currentUser: AuthUser, clientIp?: string) {
    const document = await this.findOne(id);
    const oldValues = { title: document.title, projectId: document.projectId };

    await this.documentRepository.softRemove(document);

    await this.auditService.log({
      user: currentUser,
      action: 'DELETE',
      resourceType: 'documents',
      resourceId: id,
      oldValues,
      ipAddress: clientIp,
    });

    return { message: 'Document deleted successfully' };
  }

  async exportDocument(id: string) {
    const document = await this.findOne(id);

    return {
      title: document.title,
      content: document.content,
      project: document.project?.name,
      createdBy: document.createdBy?.name,
      createdAt: document.createdAt,
      exportedAt: new Date().toISOString(),
    };
  }
}
