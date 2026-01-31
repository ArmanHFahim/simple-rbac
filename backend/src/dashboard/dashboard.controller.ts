import { Get, Controller } from '@nestjs/common';

import { AuthUser } from '@common/types';
import { CurrentUser } from '@common/decorators';

import { DashboardService } from '@dashboard/dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  async getStats(@CurrentUser() currentUser: AuthUser) {
    return this.dashboardService.getStats(currentUser);
  }
}
