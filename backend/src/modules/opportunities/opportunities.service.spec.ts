import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { OpportunitiesService } from './opportunities.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OpportunityStatus } from './enums/opportunity-status.enum';

const mockPrismaService = {
  client: {
    findUnique: jest.fn(),
  },
  opportunity: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockUserId = 'user-uuid-1';
const mockClientId = 'client-uuid-1';
const mockOpportunityId = 'opp-uuid-1';

const mockClient = { id: mockClientId, name: 'Cliente X' };
const mockOpportunity = {
  id: mockOpportunityId,
  title: 'Oportunidade Y',
  value: 5000,
  status: 'OPEN',
  clientId: mockClientId,
  responsibleUserId: mockUserId,
  client: mockClient,
  responsibleUser: { id: mockUserId, name: 'User', email: 'user@test.com' },
};

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpportunitiesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OpportunitiesService>(OpportunitiesService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const dto = { title: 'Oportunidade Y', value: 5000, clientId: mockClientId };

    it('deve criar e retornar a oportunidade quando cliente existe', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.opportunity.create.mockResolvedValue(mockOpportunity);

      const result = await service.create(dto as any, mockUserId);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({ where: { id: mockClientId } });
      expect(mockPrismaService.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ responsibleUserId: mockUserId }) }),
      );
      expect(result).toEqual(mockOpportunity);
    });

    it('deve lançar NotFoundException quando clientId não existe', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.create(dto as any, mockUserId)).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
      expect(mockPrismaService.opportunity.create).not.toHaveBeenCalled();
    });

    it('deve converter expectedCloseDate string para Date ao criar', async () => {
      const dtoWithDate = { ...dto, expectedCloseDate: '2026-06-30T00:00:00.000Z' };
      mockPrismaService.client.findUnique.mockResolvedValue(mockClient);
      mockPrismaService.opportunity.create.mockResolvedValue(mockOpportunity);

      await service.create(dtoWithDate as any, mockUserId);

      expect(mockPrismaService.opportunity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ expectedCloseDate: new Date('2026-06-30T00:00:00.000Z') }),
        }),
      );
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de oportunidades ordenada por createdAt desc', async () => {
      mockPrismaService.opportunity.findMany.mockResolvedValue([mockOpportunity]);

      const result = await service.findAll();

      expect(mockPrismaService.opportunity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
      expect(result).toEqual([mockOpportunity]);
    });
  });

  describe('findOne', () => {
    it('deve retornar a oportunidade quando encontrada', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(mockOpportunity);

      const result = await service.findOne(mockOpportunityId);

      expect(result).toEqual(mockOpportunity);
    });

    it('deve lançar NotFoundException quando oportunidade não existe', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(null);

      await expect(service.findOne('id-inexistente')).rejects.toThrow(
        new NotFoundException('Oportunidade não encontrada'),
      );
    });
  });

  describe('update', () => {
    it('deve verificar existência e atualizar a oportunidade', async () => {
      const updated = { ...mockOpportunity, status: 'WON' };
      mockPrismaService.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrismaService.opportunity.update.mockResolvedValue(updated);

      const result = await service.update(mockOpportunityId, { status: OpportunityStatus.WON } as any);

      expect(mockPrismaService.opportunity.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: mockOpportunityId } }),
      );
      expect(result.status).toBe('WON');
    });

    it('deve lançar NotFoundException quando oportunidade não existe', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(null);

      await expect(service.update('id-inexistente', {} as any)).rejects.toThrow(
        new NotFoundException('Oportunidade não encontrada'),
      );
      expect(mockPrismaService.opportunity.update).not.toHaveBeenCalled();
    });

    it('deve validar clientId ao atualizar e lançar 404 se não existe', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(
        service.update(mockOpportunityId, { clientId: 'novo-client-id' } as any),
      ).rejects.toThrow(new NotFoundException('Cliente não encontrado'));
      expect(mockPrismaService.opportunity.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve verificar existência e deletar a oportunidade', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(mockOpportunity);
      mockPrismaService.opportunity.delete.mockResolvedValue(mockOpportunity);

      await service.remove(mockOpportunityId);

      expect(mockPrismaService.opportunity.delete).toHaveBeenCalledWith({ where: { id: mockOpportunityId } });
    });

    it('deve lançar NotFoundException quando oportunidade não existe', async () => {
      mockPrismaService.opportunity.findUnique.mockResolvedValue(null);

      await expect(service.remove('id-inexistente')).rejects.toThrow(
        new NotFoundException('Oportunidade não encontrada'),
      );
      expect(mockPrismaService.opportunity.delete).not.toHaveBeenCalled();
    });
  });
});
