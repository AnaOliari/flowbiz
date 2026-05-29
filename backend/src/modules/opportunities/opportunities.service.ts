import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOpportunityDto, responsibleUserId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return this.prisma.opportunity.create({
      data: {
        ...dto,
        responsibleUserId,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
      },
      include: {
        client: true,
        responsibleUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findAll() {
    return this.prisma.opportunity.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: true,
        responsibleUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        client: true,
        responsibleUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!opportunity) {
      throw new NotFoundException('Oportunidade não encontrada');
    }

    return opportunity;
  }

  async update(id: string, dto: UpdateOpportunityDto) {
    await this.findOne(id);

    if (dto.clientId) {
      const client = await this.prisma.client.findUnique({
        where: { id: dto.clientId },
      });

      if (!client) {
        throw new NotFoundException('Cliente não encontrado');
      }
    }

    return this.prisma.opportunity.update({
      where: { id },
      data: {
        ...dto,
        expectedCloseDate: dto.expectedCloseDate
          ? new Date(dto.expectedCloseDate)
          : undefined,
      },
      include: {
        client: true,
        responsibleUser: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.opportunity.delete({ where: { id } });
  }
}
