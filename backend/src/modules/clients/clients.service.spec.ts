import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  client: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('ClientsService', () => {
  let service: ClientsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('deve criar e retornar o cliente', async () => {
      const dto = { name: 'Empresa X', email: 'x@x.com' };
      const created = { id: 'uuid-1', ...dto, createdAt: new Date(), updatedAt: new Date() };
      mockPrismaService.client.create.mockResolvedValue(created);

      const result = await service.create(dto as any);

      expect(mockPrismaService.client.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('findAll', () => {
    it('deve retornar lista de clientes ordenada por createdAt desc', async () => {
      const clients = [{ id: 'uuid-1', name: 'A' }, { id: 'uuid-2', name: 'B' }];
      mockPrismaService.client.findMany.mockResolvedValue(clients);

      const result = await service.findAll();

      expect(mockPrismaService.client.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(clients);
    });
  });

  describe('findOne', () => {
    it('deve retornar o cliente quando encontrado', async () => {
      const client = { id: 'uuid-1', name: 'Empresa X' };
      mockPrismaService.client.findUnique.mockResolvedValue(client);

      const result = await service.findOne('uuid-1');

      expect(result).toEqual(client);
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.findOne('uuid-inexistente')).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
    });
  });

  describe('update', () => {
    it('deve verificar existência e atualizar o cliente', async () => {
      const existing = { id: 'uuid-1', name: 'Antes', phone: null };
      const updated = { ...existing, phone: '11999999999' };
      mockPrismaService.client.findUnique.mockResolvedValue(existing);
      mockPrismaService.client.update.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { phone: '11999999999' } as any);

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(mockPrismaService.client.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data: { phone: '11999999999' },
      });
      expect(result).toEqual(updated);
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.update('uuid-inexistente', { name: 'X' } as any)).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
      expect(mockPrismaService.client.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deve verificar existência e deletar o cliente', async () => {
      const existing = { id: 'uuid-1', name: 'Empresa X' };
      mockPrismaService.client.findUnique.mockResolvedValue(existing);
      mockPrismaService.client.delete.mockResolvedValue(existing);

      await service.remove('uuid-1');

      expect(mockPrismaService.client.findUnique).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
      expect(mockPrismaService.client.delete).toHaveBeenCalledWith({ where: { id: 'uuid-1' } });
    });

    it('deve lançar NotFoundException quando cliente não existe', async () => {
      mockPrismaService.client.findUnique.mockResolvedValue(null);

      await expect(service.remove('uuid-inexistente')).rejects.toThrow(
        new NotFoundException('Cliente não encontrado'),
      );
      expect(mockPrismaService.client.delete).not.toHaveBeenCalled();
    });
  });
});
