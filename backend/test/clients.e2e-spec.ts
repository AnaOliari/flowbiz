import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Clients (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let createdClientId: string;

  const uniqueUserEmail = `e2e.user.${Date.now()}@test.flowbiz.com`;
  const uniqueClientEmail = `e2e.client.${Date.now()}@test.flowbiz.com`;
  const nonExistentUuid = '00000000-0000-4000-a000-000000000000';

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

    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ name: 'E2E Clients User', email: uniqueUserEmail, password: 'senha123' });

    accessToken = res.body.accessToken;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.client.deleteMany({
        where: { email: { contains: '@test.flowbiz.com' } },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: '@test.flowbiz.com' } },
      });
    }
    if (app) await app.close();
  });

  // ── POST /clients ──────────────────────────────────────────────

  describe('POST /clients', () => {
    it('deve criar cliente com todos os campos válidos e retornar 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Empresa Teste',
          email: uniqueClientEmail,
          phone: '11999999999',
          company: 'Teste Ltda',
          notes: 'Cliente VIP',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Empresa Teste');
      expect(res.body).toHaveProperty('email', uniqueClientEmail.toLowerCase());
      expect(res.body).toHaveProperty('phone', '11999999999');
      expect(res.body).toHaveProperty('company', 'Teste Ltda');
      expect(res.body).toHaveProperty('notes', 'Cliente VIP');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('updatedAt');

      createdClientId = res.body.id;
    });

    it('deve criar cliente apenas com name (campos opcionais omitidos) e retornar 201', async () => {
      const res = await request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Cliente Minimo' })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', 'Cliente Minimo');
      expect(res.body.email).toBeNull();
      expect(res.body.phone).toBeNull();

      await prisma.client.delete({ where: { id: res.body.id } });
    });

    it('deve retornar 400 quando name está ausente', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ email: 'sem-nome@test.flowbiz.com' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Nome é obrigatório');
        });
    });

    it('deve retornar 400 quando name é string vazia', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Nome é obrigatório');
        });
    });

    it('deve retornar 400 para email inválido', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Cliente X', email: 'nao-e-email' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain('Email inválido');
        });
    });

    it('deve retornar 409 para email duplicado', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Outro Cliente', email: uniqueClientEmail })
        .expect(409)
        .expect((res) => {
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toBe('Este email já está em uso');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .post('/clients')
        .send({ name: 'Sem Token' })
        .expect(401);
    });
  });

  // ── GET /clients ───────────────────────────────────────────────

  describe('GET /clients', () => {
    it('deve retornar 200 com array de clientes quando autenticado', () => {
      return request(app.getHttpServer())
        .get('/clients')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer()).get('/clients').expect(401);
    });
  });

  // ── GET /clients/:id ───────────────────────────────────────────

  describe('GET /clients/:id', () => {
    it('deve retornar 200 com o cliente correto quando ID existe', () => {
      return request(app.getHttpServer())
        .get(`/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdClientId);
          expect(res.body).toHaveProperty('name', 'Empresa Teste');
        });
    });

    it('deve retornar 404 quando ID não existe', () => {
      return request(app.getHttpServer())
        .get(`/clients/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Cliente não encontrado');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .get(`/clients/${createdClientId}`)
        .expect(401);
    });
  });

  // ── PATCH /clients/:id ─────────────────────────────────────────

  describe('PATCH /clients/:id', () => {
    it('deve retornar 200 e atualizar campo parcialmente', () => {
      return request(app.getHttpServer())
        .patch(`/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '11888888888' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', createdClientId);
          expect(res.body).toHaveProperty('phone', '11888888888');
          expect(res.body).toHaveProperty('name', 'Empresa Teste');
        });
    });

    it('deve retornar 404 quando ID não existe', () => {
      return request(app.getHttpServer())
        .patch(`/clients/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ phone: '11777777777' })
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Cliente não encontrado');
        });
    });

    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .patch(`/clients/${createdClientId}`)
        .send({ phone: '11777777777' })
        .expect(401);
    });
  });

  // ── DELETE /clients/:id ────────────────────────────────────────

  describe('DELETE /clients/:id', () => {
    it('deve retornar 401 sem token JWT', () => {
      return request(app.getHttpServer())
        .delete(`/clients/${createdClientId}`)
        .expect(401);
    });

    it('deve retornar 404 quando ID não existe', () => {
      return request(app.getHttpServer())
        .delete(`/clients/${nonExistentUuid}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.statusCode).toBe(404);
          expect(res.body.message).toBe('Cliente não encontrado');
        });
    });

    it('deve retornar 204 sem body ao deletar cliente existente', () => {
      return request(app.getHttpServer())
        .delete(`/clients/${createdClientId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204)
        .expect((res) => {
          expect(res.body).toEqual({});
        });
    });
  });
});
