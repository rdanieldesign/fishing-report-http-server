import request from 'supertest';
import * as bcrypt from 'bcrypt';
import { app } from '../app';
import { queryToPromise } from '../models/mysql-util';

jest.mock('../models/mysql-util');

const mockQuery = queryToPromise as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/signup', () => {
  it('returns 200 and a JWT string for a valid new user', async () => {
    mockQuery
      .mockResolvedValueOnce([]) // getUserWithPasswordByEmail: no existing user
      .mockResolvedValueOnce({ insertId: 1 }); // addUser

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'John', email: 'john@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
  });

  it('returns 400 for a duplicate email', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'john@test.com' }]);

    const res = await request(app)
      .post('/auth/signup')
      .send({ name: 'John', email: 'john@test.com', password: 'password123' });

    expect(res.status).toBe(400);
  });
});

describe('POST /auth/login', () => {
  it('returns 200 and a JWT string for valid credentials', async () => {
    const hashed = bcrypt.hashSync('password123', 1);
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'john@test.com', password: hashed }]);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'john@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe('string');
  });

  it('returns 500 for wrong password', async () => {
    const hashed = bcrypt.hashSync('differentpassword', 1);
    mockQuery.mockResolvedValueOnce([{ id: 1, email: 'john@test.com', password: hashed }]);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'john@test.com', password: 'password123' });

    expect(res.status).toBe(500);
  });

  it('returns 400 for an unknown email', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(400);
  });

  it('returns 500 for missing fields', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({});

    expect(res.status).toBe(500);
  });
});
