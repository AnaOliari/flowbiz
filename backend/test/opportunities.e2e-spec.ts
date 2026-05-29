import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Opportunities (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let createdClientId: string;
  let createdOpportunityId: string;

  const uniqueUserEmail = `e2e.opp.user.${Date.now()}@test.flowbiz.com`;
  const uniqueClientEmail = `e2e.opp.client.${Date.now()}@test.flowbiz.com`;
  const nonExistentUuid = '00000000-0000-4000-a000-000000000001';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // Cria usuário de teste e obtém token
    const authRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'E2E Opp User', email: uniqueUserEmail, password: 'senha123' });
    accessToken = authRes.body.accessToken;

    // Cria cliente de teste para as oportunidades
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Cliente para Opp', email: uniqueClientEmail });
    createdClientId = clientRes.body.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.opportunity.deleteMany({
        where: { client: { email: { contains: '@test.flowbiz.com' } } },
      });
      await prisma.client.deleteMany({
        where: { email: { contains: '@test.flowbiz.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: '@test.flowbiz.com' } },
      });
    }
    if (app) await app.close();
  });

  // ── POST /opportunities ────────────────────────────────────────

  describe('POST /opportunities', () => {
    it('deve criar oportunidade com campos válidos e retornar 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Venda de Software',
          description: 'Proposta de licenciamento anual',
          value: 15000,
          status: 'OPEN',
          expectedCloseDate: '2026-06-30T00:00:00.000Z',
          clientId: createdClientId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('title', 'Venda de Software');
      expect(res.body).toHaveProperty('value', 15000);
      expect(res.body).toHaveProperty('status', 'OPEN');
      expect(res.body).toHaveProperty('clientId', createdClientId);
      expect(res.body.responsibleUser).toHaveProperty('name', 'E2E Opp User');
      expect(res.body.client).toHaveProperty('id', createdClientId);

      createdOpportunityId = res.body.id;
    });

    it('deve criar oportunidade apenas com campos obrigatórios e retornar 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Opp Mínima', value: 1, clientId: createdClientId })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('OPEN');
      expect(res.body.description).toBeNull();

      await prisma.opportunity.delete({ where: { id: res.body.id } });
    });

    it('deve usar o usuário do JWT como responsibleUserId', async () => {
      const res = await request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Opp JWT Test', value: 100, clientId: createdClientId })
        .expect(201);

      expect(res.body.responsibleUser).toHaveProperty('name', 'E2E Opp User');

      await prisma.opportunity.delete({ where: { id: res.body.id } });
    });

    it('deve retornar 404 quando clientId não existe', () => {
      return request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Opp', value: 100, clientId: nonExistentUuid })
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Cliente não encontrado');
        });
    });

    it('deve retornar 400 quando title está ausente', () => {
      return request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ value: 100, clientId: createdClientId })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Título é obrigatório');
        });
    });

    it('deve retornar 400 quando value é zero ou negativo', () => {
      return request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Opp', value: 0, clientId: createdClientId })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Valor deve ser maior que zero');
        });
    });

    it('deve retornar 400 para status inválido', () => {
      return request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Opp', value: 100, clientId: createdClientId, status: 'INVALIDO' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Status inválido. Valores aceitos: OPEN, WON, LOST');
        });
    });

    it('deve retornar 400 para clientId com formato inválido (não UUID)', () => {
      return request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Opp', value: 100, clientId: 'nao-e-uuid' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('clientId deve ser um UUID válido');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .post('/opportunities')
        .send({ title: 'Opp', value: 100, clientId: createdClientId })
        .expect(401);
    });
  });

  // ── GET /opportunities ─────────────────────────────────────────

  describe('GET /opportunities', () => {
    it('deve retornar 200 com array de oportunidades quando autenticado', () => {
      return request(app.getHttpServer())
        .get('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('client');
          expect(res.body[0]).toHaveProperty('responsibleUser');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer()).get('/opportunities').expect(401);
    });
  });

  // ── GET /opportunities/:id ─────────────────────────────────────

  describe('GET /opportunities/:id', () => {
    it('deve retornar 200 com a oportunidade correta quando ID existe', () => {
      return request(app.getHttpServer())
        .get(`/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdOpportunityId);
          expect(res.body).toHaveProperty('title', 'Venda de Software');
          expect(res.body).toHaveProperty('client');
          expect(res.body).toHaveProperty('responsibleUser');
        });
    });

    it('deve retornar 404 quando UUID não existe', () => {
      return request(app.getHttpServer())
        .get(`/opportunities/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Oportunidade não encontrada');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .get(`/opportunities/${createdOpportunityId}`)
        .expect(401);
    });
  });

  // ── PATCH /opportunities/:id ───────────────────────────────────

  describe('PATCH /opportunities/:id', () => {
    it('deve retornar 200 e atualizar status parcialmente', () => {
      return request(app.getHttpServer())
        .patch(`/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'WON' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdOpportunityId);
          expect(res.body).toHaveProperty('status', 'WON');
          expect(res.body).toHaveProperty('title', 'Venda de Software');
        });
    });

    it('deve retornar 200 e atualizar valor', () => {
      return request(app.getHttpServer())
        .patch(`/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ value: 20000 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('value', 20000);
        });
    });

    it('deve retornar 404 quando UUID não existe', () => {
      return request(app.getHttpServer())
        .patch(`/opportunities/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ status: 'LOST' })
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Oportunidade não encontrada');
        });
    });

    it('deve retornar 404 quando clientId no update não existe', () => {
      return request(app.getHttpServer())
        .patch(`/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ clientId: nonExistentUuid })
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Cliente não encontrado');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .patch(`/opportunities/${createdOpportunityId}`)
        .send({ status: 'LOST' })
        .expect(401);
    });
  });

  // ── DELETE /opportunities/:id ──────────────────────────────────

  describe('DELETE /opportunities/:id', () => {
    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .delete(`/opportunities/${createdOpportunityId}`)
        .expect(401);
    });

    it('deve retornar 404 quando UUID não existe', () => {
      return request(app.getHttpServer())
        .delete(`/opportunities/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Oportunidade não encontrada');
        });
    });

    it('deve retornar 204 sem body ao deletar oportunidade existente', () => {
      return request(app.getHttpServer())
        .delete(`/opportunities/${createdOpportunityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });
  });
});
