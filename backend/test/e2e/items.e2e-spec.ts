import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Items & Price Tracking (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let trackedItemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register and login to get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'tracker@example.com',
        password: 'password123',
      });

    const cookies = loginResponse.headers['set-cookie'];
    const tokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('token='),
    );
    authToken = tokenCookie.split(';')[0].split('=')[1];
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Tracked Items Flow', () => {
    describe('POST /api/items/tracked', () => {
      it('should create a tracked item', async () => {
        const response = await request(app.getHttpServer())
          .post('/api/items/tracked')
          .set('Cookie', [`token=${authToken}`])
          .send({
            url: 'https://example.com/product/123',
            targetPrice: 50,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.url).toBe('https://example.com/product/123');
        expect(response.body.targetPrice).toBe(50);
        trackedItemId = response.body.id;
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/api/items/tracked')
          .send({
            url: 'https://example.com/product/456',
            targetPrice: 30,
          })
          .expect(401);
      });
    });

    describe('GET /api/items/tracked', () => {
      it('should get all tracked items', () => {
        return request(app.getHttpServer())
          .get('/api/items/tracked')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
          });
      });

      it('should filter tracked items by status', () => {
        return request(app.getHttpServer())
          .get('/api/items/tracked?filter=tracking')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('GET /api/items/tracked/stats', () => {
      it('should get tracked items statistics', () => {
        return request(app.getHttpServer())
          .get('/api/items/tracked/stats')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('totalTracked');
          });
      });
    });

    describe('GET /api/items/tracked/:id', () => {
      it('should get a specific tracked item', () => {
        return request(app.getHttpServer())
          .get(`/api/items/tracked/${trackedItemId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(trackedItemId);
          });
      });

      it('should fail for non-existent item', () => {
        return request(app.getHttpServer())
          .get('/api/items/tracked/non-existent-id')
          .set('Cookie', [`token=${authToken}`])
          .expect(404);
      });
    });

    describe('GET /api/items/tracked/:id/history', () => {
      it('should get price history for tracked item', () => {
        return request(app.getHttpServer())
          .get(`/api/items/tracked/${trackedItemId}/history`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('POST /api/items/tracked/:id/refresh', () => {
      it('should refresh price for tracked item', () => {
        return request(app.getHttpServer())
          .post(`/api/items/tracked/${trackedItemId}/refresh`)
          .set('Cookie', [`token=${authToken}`])
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
          });
      });
    });

    describe('PATCH /api/items/tracked/:id', () => {
      it('should update tracked item', () => {
        return request(app.getHttpServer())
          .patch(`/api/items/tracked/${trackedItemId}`)
          .set('Cookie', [`token=${authToken}`])
          .send({
            targetPrice: 45,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.targetPrice).toBe(45);
          });
      });
    });

    describe('DELETE /api/items/tracked/:id', () => {
      it('should delete tracked item', () => {
        return request(app.getHttpServer())
          .delete(`/api/items/tracked/${trackedItemId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200);
      });

      it('should verify item is deleted', () => {
        return request(app.getHttpServer())
          .get(`/api/items/tracked/${trackedItemId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(404);
      });
    });
  });

  describe('Preview Item', () => {
    it('should preview item from URL', () => {
      return request(app.getHttpServer())
        .post('/api/items/preview')
        .set('Cookie', [`token=${authToken}`])
        .send({
          url: 'https://example.com/product/preview',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('name');
        });
    });
  });
});
