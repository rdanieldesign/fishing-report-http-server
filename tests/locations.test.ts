import request from 'supertest';
import { app } from '../app';
import { queryToPromise } from '../models/mysql-util';

jest.mock('../models/mysql-util');

const mockQuery = queryToPromise as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /locations', () => {
  it('returns 200 and an array', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, name: 'Avondale Lake', googleMapsLink: 'https://maps.example.com' }]);

    const res = await request(app).get('/locations');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /locations/:id', () => {
  it('returns 200 and an object with id when the location exists', async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, name: 'Avondale Lake' }]);

    const res = await request(app).get('/locations/1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
  });

  it('returns 200 and null when the location does not exist', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app).get('/locations/999');

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe('POST /locations', () => {
  it('returns 200 for a valid body', async () => {
    mockQuery.mockResolvedValueOnce({ insertId: 1 });

    const res = await request(app)
      .post('/locations')
      .send({ name: 'New Lake', googleMapsLink: 'https://maps.example.com' });

    expect(res.status).toBe(200);
  });
});

describe('PUT /locations/:id', () => {
  it('returns 200', async () => {
    mockQuery.mockResolvedValueOnce({});

    const res = await request(app)
      .put('/locations/1')
      .send({ name: 'Updated Lake', googleMapsLink: 'https://maps.example.com' });

    expect(res.status).toBe(200);
  });
});

describe('DELETE /locations/:id', () => {
  it('returns 200', async () => {
    mockQuery.mockResolvedValueOnce({});

    const res = await request(app).delete('/locations/1');

    expect(res.status).toBe(200);
  });
});
