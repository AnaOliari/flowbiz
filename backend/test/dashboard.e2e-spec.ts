import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Dashboard (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let clientId: string;

  const uniqueUserEmail = `e2e.dash.user.${Date.now()}@test.flowbiz.com`;
  const uniqueClientEmail = `e2e.dash.client.${Date.now()}@test.flowbiz.com`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // Usuário e token
    const authRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'Dashboard User', email: uniqueUserEmail, password: 'senha123' });
    accessToken = authRes.body.accessToken;

    // Cliente para as oportunidades de teste
    const clientRes = await request(app.getHttpServer())
      .post('/clients')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'Cliente Dashboard', email: uniqueClientEmail });
    clientId = clientRes.body.id;

    // Cria oportunidades de teste: 2 OPEN, 1 WON, 1 LOST
    const opps = [
      { title: 'Opp OPEN 1', value: 10000, status: 'OPEN', clientId },
      { title: 'Opp OPEN 2', value: 5000, status: 'OPEN', clientId },
      { title: 'Opp WON', value: 20000, status: 'WON', clientId },
      { title: 'Opp LOST', value: 3000, status: 'LOST', clientId },
    ];

    for (const opp of opps) {
      await request(app.getHttpServer())
        .post('/opportunities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(opp);
    }
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

  // ── GET /dashboard ─────────────────────────────────────────────

  describe('GET /dashboard', () => {
    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer()).get('/dashboard').expect(401);
    });

    it('deve retornar 200 com todas as métricas quando autenticado', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalClients');
      expect(res.body).toHaveProperty('totalOpportunities');
      expect(res.body).toHaveProperty('openOpportunities');
      expect(res.body).toHaveProperty('wonOpportunities');
      expect(res.body).toHaveProperty('lostOpportunities');
      expect(res.body).toHaveProperty('openValue');
      expect(res.body).toHaveProperty('wonValue');
      expect(res.body).toHaveProperty('conversionRate');

      expect(typeof res.body.totalClients).toBe('number');
      expect(typeof res.body.conversionRate).toBe('number');
    });

    it('deve contabilizar as oportunidades de teste criadas no beforeAll', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // As oportunidades criadas no beforeAll devem estar nos contadores
      // (o banco pode ter dados de outros testes, por isso usamos >=)
      expect(res.body.openOpportunities).toBeGreaterThanOrEqual(2);
      expect(res.body.wonOpportunities).toBeGreaterThanOrEqual(1);
      expect(res.body.lostOpportunities).toBeGreaterThanOrEqual(1);
      expect(res.body.openValue).toBeGreaterThanOrEqual(15000);
      expect(res.body.wonValue).toBeGreaterThanOrEqual(20000);
    });

    it('deve calcular conversionRate como percentual de WON sobre totalOpportunities', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const { wonOpportunities, totalOpportunities, conversionRate } = res.body;
      const expected =
        totalOpportunities > 0
          ? Math.round((wonOpportunities / totalOpportunities) * 10000) / 100
          : 0;

      expect(conversionRate).toBe(expected);
    });

    it('todos os valores numéricos devem ser >= 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const numericFields = [
        'totalClients', 'totalOpportunities',
        'openOpportunities', 'wonOpportunities', 'lostOpportunities',
        'openValue', 'wonValue', 'conversionRate',
      ];

      for (const field of numericFields) {
        expect(res.body[field]).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
