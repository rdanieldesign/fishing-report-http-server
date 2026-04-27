import request from "supertest";
import { app } from "../app";
import { queryToPromise, multiQueryToPromise } from "../models/mysql-util";
import { signTestToken } from "./helpers";

jest.mock("../models/mysql-util");
jest.mock("../services/image-service", () => ({
  uploadMultipleImages: () => [
    (req: any, _res: any, next: any) => {
      req.uploadedImages = [];
      next();
    },
  ],
  getSignedImageUrl: async () => "https://mock-s3.example.com/image",
  deleteMultipleImages: jest.fn(),
  deleteSingleImage: jest.fn(),
}));

const mockQuery = queryToPromise as jest.Mock;
const mockMultiQuery = multiQueryToPromise as jest.Mock;
const USER_ID = 1;
const token = signTestToken(USER_ID);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Authentication middleware — GET /api/reports", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app).get("/api/reports");
    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .get("/api/reports")
      .set("x-access-token", "invalid-token");
    expect(res.status).toBe(401);
  });

  it("passes through with a valid token", async () => {
    mockMultiQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/reports")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/reports", () => {
  it("returns 200 and an array for an authenticated user", async () => {
    mockMultiQuery.mockResolvedValueOnce([{ id: 1, authorId: USER_ID }]);

    const res = await request(app)
      .get("/api/reports")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/reports/my-reports", () => {
  it("returns 200 and an array filtered to current user", async () => {
    mockMultiQuery.mockResolvedValueOnce([{ id: 1, authorId: USER_ID }]);

    const res = await request(app)
      .get("/api/reports/my-reports")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/reports/:id", () => {
  it("returns 200 and an object when the user can see the report", async () => {
    mockMultiQuery.mockResolvedValueOnce([
      { id: 1, authorId: USER_ID, imageIds: null },
    ]);

    const res = await request(app)
      .get("/api/reports/1")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 200 and null when the user cannot see the report", async () => {
    mockMultiQuery.mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/reports/99")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("POST /api/reports", () => {
  it("returns 200", async () => {
    mockQuery.mockResolvedValueOnce({ insertId: 1 });

    const res = await request(app)
      .post("/api/reports")
      .set("x-access-token", token)
      .send({
        locationId: 1,
        date: "2024-06-01",
        catchCount: 3,
        notes: "Good day",
      });

    expect(res.status).toBe(200);
  });
});

describe("PUT /api/reports/:id", () => {
  const reportBody = {
    locationId: 1,
    date: "2024-06-01",
    catchCount: 3,
    notes: "Updated",
    imageIds: "[]",
  };

  it("returns 200 when updating own report", async () => {
    mockMultiQuery.mockResolvedValueOnce([
      { id: 1, authorId: USER_ID, imageIds: null },
    ]);
    mockQuery.mockResolvedValueOnce({});

    const res = await request(app)
      .put("/api/reports/1")
      .set("x-access-token", token)
      .send(reportBody);

    expect(res.status).toBe(200);
  });

  it("returns 403 when updating another user's report", async () => {
    mockMultiQuery.mockResolvedValueOnce([
      { id: 1, authorId: 999, imageIds: null },
    ]);

    const res = await request(app)
      .put("/api/reports/1")
      .set("x-access-token", token)
      .send(reportBody);

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/reports/:id", () => {
  it("returns 200 when deleting own report", async () => {
    mockMultiQuery.mockResolvedValueOnce([
      { id: 1, authorId: USER_ID, imageIds: null },
    ]);
    mockQuery.mockResolvedValueOnce({});

    const res = await request(app)
      .delete("/api/reports/1")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
  });

  it("returns 403 when deleting another user's report", async () => {
    mockMultiQuery.mockResolvedValueOnce([
      { id: 1, authorId: 999, imageIds: null },
    ]);

    const res = await request(app)
      .delete("/api/reports/1")
      .set("x-access-token", token);

    expect(res.status).toBe(403);
  });
});
