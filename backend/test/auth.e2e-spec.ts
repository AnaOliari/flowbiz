import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E tests: Auth & Users
 *
 * Ordem importa: o primeiro teste de register salva o accessToken
 * usado pelos testes de GET /users/me.
 *
 * Cleanup: afterAll deleta todos os usuários cujo email termina
 * com @test.flowbiz.com, mantendo o banco limpo entre execuções.
 */
describe('Auth & Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;

  // Email único por execução — evita colisão se o cleanup anterior falhou
  const uniqueEmail = `e2e.${Date.now()}@test.flowbiz.com`;

  // ── Setup / Teardown ───────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Espelha exatamente o que main.ts configura em produção
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
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { contains: '@test.flowbiz.com' } },
      });
    }
    if (app) await app.close();
  });

  // ── POST /auth/register ────────────────────────────────────────

  describe('POST /auth/register', () => {
    it('deve criar usuário com dados válidos e retornar accessToken + refreshToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'E2E User', email: uniqueEmail, password: 'senha123' })
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      // tokens são strings não-vazias
      expect(typeof res.body.accessToken).toBe('string');
      expect(res.body.accessToken.length).toBeGreaterThan(0);
      // password nunca deve vazar na resposta de register
      expect(res.body).not.toHaveProperty('password');

      // salva para os testes de GET /users/me
      accessToken = res.body.accessToken;
    });

    it('deve retornar 409 para email duplicado', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Outro', email: uniqueEmail, password: 'outrasenha' })
        .expect(409)
        .expect((res) => {
          expect(res.body.statusCode).toBe(409);
          expect(res.body.message).toBe('Email já está em uso');
        });
    });

    it('deve retornar 400 para email inválido', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: 'nao-e-email', password: 'senha123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          // message é string[] quando ValidationPipe dispara
          expect(res.body.message).toContain('Email inválido');
        });
    });

    it('deve retornar 400 para senha curta (menos de 6 caracteres)', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Test', email: 'valid@example.com', password: '123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.statusCode).toBe(400);
          expect(res.body.message).toContain(
            'Senha deve ter no mínimo 6 caracteres',
          );
        });
    });
  });

  // ── GET /users/me ──────────────────────────────────────────────

  describe('GET /users/me', () => {
    it('deve retornar 401 sem token de autenticação', () => {
      return request(app.getHttpServer()).get('/users/me').expect(401);
    });

    it('deve retornar 200 com Bearer token válido e sem campos sensíveis', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          // campos públicos presentes
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('name', 'E2E User');
          // email deve estar normalizado em lowercase (via @Transform)
          expect(res.body).toHaveProperty('email', uniqueEmail.toLowerCase());
          expect(res.body).toHaveProperty('role', 'user');
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');

          // campos sensíveis NUNCA devem aparecer
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('refreshToken');
        });
    });
  });
});
