import request from "supertest";
import { app } from "../app";
import { queryToPromise } from "../models/mysql-util";

jest.mock("../models/mysql-util");

const mockQuery = queryToPromise as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/locations", () => {
  it("returns 200 and an array", async () => {
    mockQuery.mockResolvedValueOnce([
      {
        id: 1,
        name: "Avondale Lake",
        googleMapsLink: "https://maps.example.com",
      },
    ]);

    const res = await request(app).get("/api/locations");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/locations/:id", () => {
  it("returns 200 and an object with id when the location exists", async () => {
    mockQuery.mockResolvedValueOnce([{ id: 1, name: "Avondale Lake" }]);

    const res = await request(app).get("/api/locations/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 200 and null when the location does not exist", async () => {
    mockQuery.mockResolvedValueOnce([]);

    const res = await request(app).get("/api/locations/999");

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("POST /api/locations", () => {
  it("returns 200 for a valid body", async () => {
    mockQuery.mockResolvedValueOnce({ insertId: 1 });

    const res = await request(app)
      .post("/api/locations")
      .send({ name: "New Lake", googleMapsLink: "https://maps.example.com" });

    expect(res.status).toBe(200);
  });
});

describe("PUT /api/locations/:id", () => {
  it("returns 200", async () => {
    mockQuery.mockResolvedValueOnce({});

    const res = await request(app).put("/api/locations/1").send({
      name: "Updated Lake",
      googleMapsLink: "https://maps.example.com",
    });

    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/locations/:id", () => {
  it("returns 200", async () => {
    mockQuery.mockResolvedValueOnce({});

    const res = await request(app).delete("/api/locations/1");

    expect(res.status).toBe(200);
  });
});
