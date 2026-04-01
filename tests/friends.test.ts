import request from 'supertest';
import { app } from '../app';
import { queryToPromise } from '../models/mysql-util';
import { FriendStatus } from '../enums/friend-enum';
import { signTestToken } from './helpers';

jest.mock('../models/mysql-util');

const mockQuery = queryToPromise as jest.Mock;
const USER_ID = 1;
const FRIEND_ID = 2;
const token = signTestToken(USER_ID);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Authentication middleware — GET /friends', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).get('/friends');
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .get('/friends')
      .set('x-access-token', 'invalid-token');
    expect(res.status).toBe(401);
  });

  it('passes through with a valid token', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/friends')
      .set('x-access-token', token);

    expect(res.status).toBe(200);
  });
});

describe('GET /friends', () => {
  it('returns 200 and an array', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/friends')
      .set('x-access-token', token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /friends/requests', () => {
  it('returns 200 and an array', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/friends/requests')
      .set('x-access-token', token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /friends/pending', () => {
  it('returns 200 and an array', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/friends/pending')
      .set('x-access-token', token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /friends/options', () => {
  it('returns 200 and an array', async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get('/friends/options')
      .set('x-access-token', token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /friends', () => {
  it('returns 200 when creating a friend request', async () => {
    mockQuery
      .mockResolvedValueOnce([]) // getFriendship: no existing friendship
      .mockResolvedValueOnce({}); // createFriendship

    const res = await request(app)
      .post('/friends')
      .set('x-access-token', token)
      .send({ userId: FRIEND_ID });

    expect(res.status).toBe(200);
  });
});

describe('PUT /friends', () => {
  it('returns 200 when the correct user updates the friendship', async () => {
    // Friendship where actionUserId matches the authenticated user
    mockQuery
      .mockResolvedValueOnce([{
        userOneId: USER_ID,
        userTwoId: FRIEND_ID,
        status: FriendStatus.Requested,
        actionUserId: USER_ID,
      }]) // getFriendship
      .mockResolvedValueOnce({}); // updateFriendStatus

    const res = await request(app)
      .put('/friends')
      .set('x-access-token', token)
      .send({ userId: FRIEND_ID, status: FriendStatus.Confirmed });

    expect(res.status).toBe(200);
  });

  it('returns 403 when the wrong user tries to update the friendship', async () => {
    // Friendship where actionUserId does NOT match the authenticated user
    mockQuery.mockResolvedValueOnce([{
      userOneId: USER_ID,
      userTwoId: FRIEND_ID,
      status: FriendStatus.Requested,
      actionUserId: FRIEND_ID, // not USER_ID
    }]);

    const res = await request(app)
      .put('/friends')
      .set('x-access-token', token)
      .send({ userId: FRIEND_ID, status: FriendStatus.Confirmed });

    expect(res.status).toBe(403);
  });
});
