import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  client: { count: jest.fn() },
  opportunity: { count: jest.fn(), aggregate: jest.fn() },
};

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getMetrics', () => {
    it('deve retornar métricas consolidadas corretamente', async () => {
      mockPrismaService.client.count.mockResolvedValue(15);
      mockPrismaService.opportunity.count
        .mockResolvedValueOnce(20) // totalOpportunities
        .mockResolvedValueOnce(8)  // openOpportunities
        .mockResolvedValueOnce(10) // wonOpportunities
        .mockResolvedValueOnce(2); // lostOpportunities
      mockPrismaService.opportunity.aggregate
        .mockResolvedValueOnce({ _sum: { value: 35000 } }) // openValue
        .mockResolvedValueOnce({ _sum: { value: 120000 } }); // wonValue

      const result = await service.getMetrics();

      expect(result).toEqual({
        totalClients: 15,
        totalOpportunities: 20,
        openOpportunities: 8,
        wonOpportunities: 10,
        lostOpportunities: 2,
        openValue: 35000,
        wonValue: 120000,
        conversionRate: 50,
      });
    });

    it('deve retornar conversionRate 0 quando não há oportunidades', async () => {
      mockPrismaService.client.count.mockResolvedValue(0);
      mockPrismaService.opportunity.count.mockResolvedValue(0);
      mockPrismaService.opportunity.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getMetrics();

      expect(result.conversionRate).toBe(0);
      expect(result.openValue).toBe(0);
      expect(result.wonValue).toBe(0);
    });

    it('deve calcular conversionRate com duas casas decimais', async () => {
      mockPrismaService.client.count.mockResolvedValue(1);
      mockPrismaService.opportunity.count
        .mockResolvedValueOnce(3)  // total
        .mockResolvedValueOnce(0)  // open
        .mockResolvedValueOnce(1)  // won
        .mockResolvedValueOnce(2); // lost
      mockPrismaService.opportunity.aggregate.mockResolvedValue({ _sum: { value: null } });

      const result = await service.getMetrics();

      // 1/3 * 100 = 33.33
      expect(result.conversionRate).toBe(33.33);
    });

    it('deve usar agregações do Prisma com os filtros de status corretos', async () => {
      mockPrismaService.client.count.mockResolvedValue(0);
      mockPrismaService.opportunity.count.mockResolvedValue(0);
      mockPrismaService.opportunity.aggregate.mockResolvedValue({ _sum: { value: null } });

      await service.getMetrics();

      expect(mockPrismaService.opportunity.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'OPEN' }, _sum: { value: true } }),
      );
      expect(mockPrismaService.opportunity.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'WON' }, _sum: { value: true } }),
      );
    });
  });
});
