import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Alerts (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let alertId: string;
  let trackedItemId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Register and login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'alerts@example.com',
        password: 'password123',
      });

    const cookies = loginResponse.headers['set-cookie'];
    const tokenCookie = cookies.find((cookie: string) =>
      cookie.startsWith('token='),
    );
    authToken = tokenCookie.split(';')[0].split('=')[1];

    // Create a tracked item for testing alerts
    const itemResponse = await request(app.getHttpServer())
      .post('/api/items/tracked')
      .set('Cookie', [`token=${authToken}`])
      .send({
        url: 'https://example.com/product/alert-test',
        targetPrice: 100,
      });
    trackedItemId = itemResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Alerts Management', () => {
    describe('POST /alerts', () => {
      it('should create a new alert', async () => {
        const response = await request(app.getHttpServer())
          .post('/alerts')
          .set('Cookie', [`token=${authToken}`])
          .send({
            itemId: trackedItemId,
            targetPrice: 80,
            alertType: 'price_drop',
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.targetPrice).toBe(80);
        alertId = response.body.id;
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/alerts')
          .send({
            itemId: trackedItemId,
            targetPrice: 70,
          })
          .expect(401);
      });
    });

    describe('GET /alerts', () => {
      it('should get all alerts', () => {
        return request(app.getHttpServer())
          .get('/alerts')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
          });
      });

      it('should get only active alerts', () => {
        return request(app.getHttpServer())
          .get('/alerts?activeOnly=true')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer()).get('/alerts').expect(401);
      });
    });

    describe('GET /alerts/item/:itemId', () => {
      it('should get alerts for specific item', () => {
        return request(app.getHttpServer())
          .get(`/alerts/item/${trackedItemId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('GET /alerts/:id', () => {
      it('should get a specific alert', () => {
        return request(app.getHttpServer())
          .get(`/alerts/${alertId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(alertId);
          });
      });

      it('should fail for non-existent alert', () => {
        return request(app.getHttpServer())
          .get('/alerts/non-existent-id')
          .set('Cookie', [`token=${authToken}`])
          .expect(404);
      });
    });

    describe('PATCH /alerts/:id', () => {
      it('should update an alert', () => {
        return request(app.getHttpServer())
          .patch(`/alerts/${alertId}`)
          .set('Cookie', [`token=${authToken}`])
          .send({
            targetPrice: 75,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.targetPrice).toBe(75);
          });
      });
    });

    describe('DELETE /alerts/:id', () => {
      it('should delete an alert', () => {
        return request(app.getHttpServer())
          .delete(`/alerts/${alertId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200);
      });

      it('should verify alert is deleted', () => {
        return request(app.getHttpServer())
          .get(`/alerts/${alertId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(404);
      });
    });
  });
});
