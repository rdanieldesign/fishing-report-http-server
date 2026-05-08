import request from "supertest";
import { app } from "../app";
import * as usersRepo from "../features/users/users.repository";
import { signTestToken } from "./helpers";

jest.mock("../features/users/users.repository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Authentication middleware — GET /api/users/current", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/users/current");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .get("/api/users/current")
      .set("x-access-token", "not-a-valid-token");
    expect(res.status).toBe(401);
  });

  it("passes through with a valid token", async () => {
    jest.spyOn(usersRepo, "getUser").mockResolvedValueOnce({
      id: 1,
      name: "John",
      email: "john@test.com",
    });

    const res = await request(app)
      .get("/api/users/current")
      .set("x-access-token", signTestToken(1));

    expect(res.status).toBe(200);
  });
});

describe("GET /api/users", () => {
  it("returns 200 and an array (no auth required)", async () => {
    jest
      .spyOn(usersRepo, "getUsers")
      .mockResolvedValueOnce([{ id: 1, name: "John", email: "john@test.com" }]);

    const res = await request(app).get("/api/users");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/users/:id", () => {
  it("returns 200 and an object when user exists", async () => {
    jest
      .spyOn(usersRepo, "getUser")
      .mockResolvedValueOnce({ id: 1, name: "John", email: "john@test.com" });

    const res = await request(app).get("/api/users/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 200 and null when user does not exist", async () => {
    jest.spyOn(usersRepo, "getUser").mockResolvedValueOnce(undefined);

    const res = await request(app).get("/api/users/999");

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("GET /api/users/current", () => {
  it("returns 200 with id, email, and name for an authenticated user", async () => {
    jest
      .spyOn(usersRepo, "getUser")
      .mockResolvedValueOnce({ id: 1, name: "John", email: "john@test.com" });

    const res = await request(app)
      .get("/api/users/current")
      .set("x-access-token", signTestToken(1));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
    expect(res.body).toHaveProperty("email");
    expect(res.body).toHaveProperty("name");
  });
});
