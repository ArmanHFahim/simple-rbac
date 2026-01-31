import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AuditLog } from '@entities';

import { AuditQueryDto, CreateAuditLogDto } from '@audit/dto/audit.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) { }

  async log(params: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = new AuditLog();
    auditLog.userId = params.user.id;
    auditLog.action = params.action;
    auditLog.resourceType = params.resourceType;
    auditLog.resourceId = params.resourceId;
    auditLog.oldValues = params.oldValues || null as any;
    auditLog.newValues = this.sanitizeValues(params.newValues) as any;
    auditLog.ipAddress = params.ipAddress as any;
    auditLog.userAgent = params.userAgent as any;

    return this.auditLogRepository.save(auditLog);
  }

  async findAll(params: AuditQueryDto) {
    const {
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      resourceType,
      resourceId,
      userId,
      action,
    } = params;

    const queryBuilder = this.auditLogRepository
      .createQueryBuilder('audit')
      .leftJoinAndSelect('audit.user', 'user')
      .select([
        'audit.id',
        'audit.action',
        'audit.resourceType',
        'audit.resourceId',
        'audit.oldValues',
        'audit.newValues',
        'audit.ipAddress',
        'audit.createdAt',
        'user.id',
        'user.name',
        'user.email',
      ]);

    if (resourceType) {
      queryBuilder.andWhere('audit.resourceType = :resourceType', { resourceType });
    }
    if (resourceId) {
      queryBuilder.andWhere('audit.resourceId = :resourceId', { resourceId });
    }
    if (userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId });
    }
    if (action) {
      queryBuilder.andWhere('audit.action = :action', { action });
    }

    queryBuilder.orderBy(`audit.${sortBy}`, sortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<AuditLog | null> {
    return this.auditLogRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async getResourceHistory(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      where: { resourceType, resourceId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  private sanitizeValues(values?: Record<string, any>): Record<string, any> | null {
    if (!values) return null;

    const sensitiveFields = ['password', 'passwordHash', 'token', 'secret'];
    const sanitized = { ...values };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    return sanitized;
  }
}
