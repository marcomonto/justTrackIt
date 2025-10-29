import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Notifications (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

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
        email: 'notifications@example.com',
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

  describe('Notifications Management', () => {
    describe('GET /notifications', () => {
      it('should get all notifications with default limit', () => {
        return request(app.getHttpServer())
          .get('/notifications')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('should get notifications with custom limit', () => {
        return request(app.getHttpServer())
          .get('/notifications?limit=10')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer()).get('/notifications').expect(401);
      });
    });

    describe('GET /notifications/unread-count', () => {
      it('should get unread notifications count', () => {
        return request(app.getHttpServer())
          .get('/notifications/unread-count')
          .set('Cookie', [`token=${authToken}`])
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('count');
            expect(typeof res.body.count).toBe('number');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get('/notifications/unread-count')
          .expect(401);
      });
    });

    describe('GET /notifications/:id/read', () => {
      it('should mark notification as read', async () => {
        // First get notifications to have an ID
        const notificationsRes = await request(app.getHttpServer())
          .get('/notifications')
          .set('Cookie', [`token=${authToken}`]);

        if (notificationsRes.body.length > 0) {
          const notificationId = notificationsRes.body[0].id;

          return request(app.getHttpServer())
            .get(`/notifications/${notificationId}/read`)
            .set('Cookie', [`token=${authToken}`])
            .expect(200);
        }
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .get('/notifications/some-id/read')
          .expect(401);
      });
    });
  });
});
