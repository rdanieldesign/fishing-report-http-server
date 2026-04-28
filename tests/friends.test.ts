import request from "supertest";
import { app } from "../app";
import { FriendStatus } from "../enums/friend-enum";
import * as friendsRepo from "../features/friends/friends.repository";
import { signTestToken } from "./helpers";

jest.mock("../features/friends/friends.repository");

const USER_ID = 1;
const FRIEND_ID = 2;
const token = signTestToken(USER_ID);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Authentication middleware — GET /api/friends", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/friends");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .get("/api/friends")
      .set("x-access-token", "invalid-token");
    expect(res.status).toBe(401);
  });

  it("passes through with a valid token", async () => {
    jest.spyOn(friendsRepo, "getFriends").mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/friends")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/friends", () => {
  it("returns 200 and an array", async () => {
    jest.spyOn(friendsRepo, "getFriends").mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/friends")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/friends/requests", () => {
  it("returns 200 and an array", async () => {
    jest.spyOn(friendsRepo, "getFriendRequests").mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/friends/requests")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/friends/pending", () => {
  it("returns 200 and an array", async () => {
    jest
      .spyOn(friendsRepo, "getFriendPendingRequests")
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/friends/pending")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/friends/options", () => {
  it("returns 200 and an array", async () => {
    jest.spyOn(friendsRepo, "getFriendOptions").mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/friends/options")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("POST /api/friends", () => {
  it("returns 200 when creating a friend request", async () => {
    jest.spyOn(friendsRepo, "getFriendship").mockResolvedValueOnce(undefined);
    jest
      .spyOn(friendsRepo, "createFriendship")
      .mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/friends")
      .set("x-access-token", token)
      .send({ userId: FRIEND_ID });

    expect(res.status).toBe(200);
  });
});

describe("PUT /api/friends", () => {
  it("returns 200 when the correct user updates the friendship", async () => {
    jest.spyOn(friendsRepo, "getFriendship").mockResolvedValueOnce({
      userOneId: USER_ID,
      userTwoId: FRIEND_ID,
      status: FriendStatus.Requested,
      actionUserId: USER_ID,
    });
    jest
      .spyOn(friendsRepo, "updateFriendStatus")
      .mockResolvedValueOnce(undefined);

    const res = await request(app)
      .put("/api/friends")
      .set("x-access-token", token)
      .send({ userId: FRIEND_ID, status: FriendStatus.Confirmed });

    expect(res.status).toBe(200);
  });

  it("returns 403 when the wrong user tries to update the friendship", async () => {
    jest.spyOn(friendsRepo, "getFriendship").mockResolvedValueOnce({
      userOneId: USER_ID,
      userTwoId: FRIEND_ID,
      status: FriendStatus.Requested,
      actionUserId: FRIEND_ID, // not USER_ID
    });

    const res = await request(app)
      .put("/api/friends")
      .set("x-access-token", token)
      .send({ userId: FRIEND_ID, status: FriendStatus.Confirmed });

    expect(res.status).toBe(403);
  });
});
