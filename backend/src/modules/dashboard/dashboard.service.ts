import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics() {
    const [
      totalClients,
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      openValueAgg,
      wonValueAgg,
    ] = await Promise.all([
      this.prisma.client.count(),
      this.prisma.opportunity.count(),
      this.prisma.opportunity.count({ where: { status: 'OPEN' } }),
      this.prisma.opportunity.count({ where: { status: 'WON' } }),
      this.prisma.opportunity.count({ where: { status: 'LOST' } }),
      this.prisma.opportunity.aggregate({ where: { status: 'OPEN' }, _sum: { value: true } }),
      this.prisma.opportunity.aggregate({ where: { status: 'WON' }, _sum: { value: true } }),
    ]);

    const openValue = openValueAgg._sum.value ?? 0;
    const wonValue = wonValueAgg._sum.value ?? 0;
    const conversionRate =
      totalOpportunities > 0
        ? Math.round((wonOpportunities / totalOpportunities) * 10000) / 100
        : 0;

    return {
      totalClients,
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      openValue,
      wonValue,
      conversionRate,
    };
  }
}
