import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { AppModule } from '../../src/app.module';

describe('Stores (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let storeId: string;

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
        email: 'admin@example.com',
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

  describe('Stores Management', () => {
    describe('POST /stores', () => {
      it('should create a new store', async () => {
        const response = await request(app.getHttpServer())
          .post('/stores')
          .set('Cookie', [`token=${authToken}`])
          .send({
            name: 'Test Store',
            domain: 'teststore.com',
            isActive: true,
          })
          .expect(201);

        expect(response.body).toHaveProperty('id');
        expect(response.body.name).toBe('Test Store');
        storeId = response.body.id;
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .post('/stores')
          .send({
            name: 'Another Store',
            domain: 'another.com',
          })
          .expect(401);
      });
    });

    describe('GET /stores', () => {
      it('should get all stores', () => {
        return request(app.getHttpServer())
          .get('/stores')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
          });
      });

      it('should get only active stores', () => {
        return request(app.getHttpServer())
          .get('/stores?activeOnly=true')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
          });
      });
    });

    describe('GET /stores/:id', () => {
      it('should get a specific store', () => {
        return request(app.getHttpServer())
          .get(`/stores/${storeId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.id).toBe(storeId);
            expect(res.body.name).toBe('Test Store');
          });
      });

      it('should fail for non-existent store', () => {
        return request(app.getHttpServer())
          .get('/stores/non-existent-id')
          .expect(404);
      });
    });

    describe('PATCH /stores/:id', () => {
      it('should update a store', () => {
        return request(app.getHttpServer())
          .patch(`/stores/${storeId}`)
          .set('Cookie', [`token=${authToken}`])
          .send({
            name: 'Updated Store Name',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.name).toBe('Updated Store Name');
          });
      });

      it('should fail without authentication', () => {
        return request(app.getHttpServer())
          .patch(`/stores/${storeId}`)
          .send({
            name: 'Unauthorized Update',
          })
          .expect(401);
      });
    });

    describe('DELETE /stores/:id', () => {
      it('should delete a store', () => {
        return request(app.getHttpServer())
          .delete(`/stores/${storeId}`)
          .set('Cookie', [`token=${authToken}`])
          .expect(200);
      });

      it('should verify store is deleted', () => {
        return request(app.getHttpServer())
          .get(`/stores/${storeId}`)
          .expect(404);
      });

      it('should fail without authentication', async () => {
        // Create a new store to test deletion without auth
        const createResponse = await request(app.getHttpServer())
          .post('/stores')
          .set('Cookie', [`token=${authToken}`])
          .send({
            name: 'To Delete',
            domain: 'todelete.com',
          });

        const newStoreId = createResponse.body.id;

        return request(app.getHttpServer())
          .delete(`/stores/${newStoreId}`)
          .expect(401);
      });
    });
  });
});
