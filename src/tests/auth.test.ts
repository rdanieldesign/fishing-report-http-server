import * as bcrypt from "bcrypt";
import request from "supertest";
import { app } from "../app";
import * as usersRepo from "../features/users/users.repository";

jest.mock("../features/users/users.repository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/signup", () => {
  it("returns 200 and a JWT string for a valid new user", async () => {
    jest
      .spyOn(usersRepo, "getUserWithPasswordByEmail")
      .mockResolvedValueOnce(undefined);
    jest.spyOn(usersRepo, "addUser").mockResolvedValueOnce(1);

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "John", email: "john@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("string");
  });

  it("returns 400 for a duplicate email", async () => {
    jest.spyOn(usersRepo, "getUserWithPasswordByEmail").mockResolvedValueOnce({
      id: 1,
      name: "John",
      email: "john@test.com",
      password: "hashed",
    });

    const res = await request(app)
      .post("/api/auth/signup")
      .send({ name: "John", email: "john@test.com", password: "password123" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("returns 200 and a JWT string for valid credentials", async () => {
    const hashed = bcrypt.hashSync("password123", 1);
    jest.spyOn(usersRepo, "getUserWithPasswordByEmail").mockResolvedValueOnce({
      id: 1,
      name: "John",
      email: "john@test.com",
      password: hashed,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "john@test.com", password: "password123" });

    expect(res.status).toBe(200);
    expect(typeof res.body).toBe("string");
  });

  it("returns 500 for wrong password", async () => {
    const hashed = bcrypt.hashSync("differentpassword", 1);
    jest.spyOn(usersRepo, "getUserWithPasswordByEmail").mockResolvedValueOnce({
      id: 1,
      name: "John",
      email: "john@test.com",
      password: hashed,
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "john@test.com", password: "password123" });

    expect(res.status).toBe(500);
  });

  it("returns 400 for an unknown email", async () => {
    jest
      .spyOn(usersRepo, "getUserWithPasswordByEmail")
      .mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "password123" });

    expect(res.status).toBe(400);
  });

  it("returns 500 for missing fields", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(500);
  });
});
