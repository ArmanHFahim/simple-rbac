import { Get, Param, Query, Controller } from '@nestjs/common';

import { zodPipe } from '@common/pipes';
import { RequirePermissions } from '@common/decorators';

import { AuditQueryDto, auditQuerySchema } from '@audit/dto/audit.dto';

import { AuditService } from '@audit/audit.service';

@Controller('audit-logs')
@RequirePermissions('audit:read')
export class AuditController {
  constructor(private readonly auditService: AuditService) { }

  @Get()
  async findAll(@Query(zodPipe(auditQuerySchema)) query: AuditQueryDto) {
    return this.auditService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.auditService.findOne(id);
  }
}
