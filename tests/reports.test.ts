import request from "supertest";
import { app } from "../app";
import * as reportsRepo from "../features/reports/reports.repository";
import * as locationsRepo from "../features/locations/locations.repository";
import * as reportsService from "../features/reports/reports.service";
import { signTestToken } from "./helpers";

jest.mock("../features/reports/reports.repository");
jest.mock("../features/locations/locations.repository");
jest.mock("../queue/usgs.queue");
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
    jest.spyOn(reportsRepo, "getReportDetails").mockResolvedValueOnce([]);

    const res = await request(app)
      .get("/api/reports")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
  });
});

describe("GET /api/reports", () => {
  it("returns 200 and an array for an authenticated user", async () => {
    jest
      .spyOn(reportsRepo, "getReportDetails")
      .mockResolvedValueOnce([{ id: 1, authorId: USER_ID } as any]);

    const res = await request(app)
      .get("/api/reports")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/reports/my-reports", () => {
  it("returns 200 and an array filtered to current user", async () => {
    jest
      .spyOn(reportsRepo, "getReportDetails")
      .mockResolvedValueOnce([{ id: 1, authorId: USER_ID } as any]);

    const res = await request(app)
      .get("/api/reports/my-reports")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/reports/:id", () => {
  it("returns 200 and an object when the user can see the report", async () => {
    jest.spyOn(reportsRepo, "getReportById").mockResolvedValueOnce({
      id: 1,
      authorId: USER_ID,
      imageIds: null,
    } as any);

    const res = await request(app)
      .get("/api/reports/1")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 200 and null when the user cannot see the report", async () => {
    jest.spyOn(reportsRepo, "getReportById").mockResolvedValueOnce(undefined);

    const res = await request(app)
      .get("/api/reports/99")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("POST /api/reports", () => {
  it("returns 200", async () => {
    jest.spyOn(reportsRepo, "addReport").mockResolvedValueOnce(1);
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce({
      id: 1,
      name: "Test Lake",
      googleMapsLink: "https://maps.example.com",
      usgsLocationId: null,
    } as any);

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
    jest.spyOn(reportsRepo, "getReportByIdForOwnership").mockResolvedValueOnce({
      id: 1,
      authorId: USER_ID,
      imageIds: null,
    } as any);
    jest.spyOn(reportsRepo, "updateReport").mockResolvedValueOnce(undefined);

    const res = await request(app)
      .put("/api/reports/1")
      .set("x-access-token", token)
      .send(reportBody);

    expect(res.status).toBe(200);
  });

  it("returns 403 when updating another user's report", async () => {
    jest.spyOn(reportsRepo, "getReportByIdForOwnership").mockResolvedValueOnce({
      id: 1,
      authorId: 999,
      imageIds: null,
    } as any);

    const res = await request(app)
      .put("/api/reports/1")
      .set("x-access-token", token)
      .send(reportBody);

    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/reports/:id", () => {
  it("returns 200 when deleting own report", async () => {
    jest.spyOn(reportsRepo, "getReportByIdForOwnership").mockResolvedValueOnce({
      id: 1,
      authorId: USER_ID,
      imageIds: null,
    } as any);
    jest.spyOn(reportsRepo, "deleteReport").mockResolvedValueOnce(undefined);

    const res = await request(app)
      .delete("/api/reports/1")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
  });

  it("returns 403 when deleting another user's report", async () => {
    jest.spyOn(reportsRepo, "getReportByIdForOwnership").mockResolvedValueOnce({
      id: 1,
      authorId: 999,
      imageIds: null,
    } as any);

    const res = await request(app)
      .delete("/api/reports/1")
      .set("x-access-token", token);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/reports/:id/usgs", () => {
  const usgsBody = { usgsLocationId: "usgs-12345", reportDate: "2024-06-01" };

  it("returns 401 with no token", async () => {
    const res = await request(app).post("/api/reports/1/usgs").send(usgsBody);
    expect(res.status).toBe(401);
  });

  it("returns 200 and enqueues the job when user owns the report", async () => {
    const { usgsQueue } = require("../queue/usgs.queue");
    jest.spyOn(reportsRepo, "getReportByIdForOwnership").mockResolvedValueOnce({
      id: 1,
      authorId: USER_ID,
      imageIds: null,
    } as any);

    const res = await request(app)
      .post("/api/reports/1/usgs")
      .set("x-access-token", token)
      .send(usgsBody);

    expect(res.status).toBe(200);
    expect(usgsQueue.add).toHaveBeenCalledWith("fetch-usgs", {
      postId: 1,
      usgsLocationId: "usgs-12345",
      reportDate: "2024-06-01",
    });
  });

  it("returns 403 when user does not own the report", async () => {
    jest.spyOn(reportsRepo, "getReportByIdForOwnership").mockResolvedValueOnce({
      id: 1,
      authorId: 999,
      imageIds: null,
    } as any);

    const res = await request(app)
      .post("/api/reports/1/usgs")
      .set("x-access-token", token)
      .send(usgsBody);

    expect(res.status).toBe(403);
  });

  it("returns 403 when the report does not exist", async () => {
    jest
      .spyOn(reportsRepo, "getReportByIdForOwnership")
      .mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/reports/99/usgs")
      .set("x-access-token", token)
      .send(usgsBody);

    expect(res.status).toBe(403);
  });
});

describe("addReport service with async USGS queue", () => {
  it("queues a USGS fetch job when location has usgsLocationId", async () => {
    const { usgsQueue } = require("../queue/usgs.queue");
    jest.spyOn(reportsRepo, "addReport").mockResolvedValueOnce(42);
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce({
      id: 1,
      name: "Test Lake",
      googleMapsLink: "https://maps.example.com",
      usgsLocationId: "usgs-12345",
    });

    await reportsService.addReport(
      {
        locationId: 1,
        date: "2024-06-01",
        catchCount: 5,
        authorId: USER_ID,
        notes: "Great catch",
      },
      [],
    );

    expect(usgsQueue.add).toHaveBeenCalledWith("fetch-usgs", {
      postId: 42,
      usgsLocationId: "usgs-12345",
      reportDate: "2024-06-01",
    });
  });

  it("does not queue a USGS fetch job when location lacks usgsLocationId", async () => {
    const { usgsQueue } = require("../queue/usgs.queue");
    jest.spyOn(reportsRepo, "addReport").mockResolvedValueOnce(43);
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce({
      id: 2,
      name: "Unknown Lake",
      googleMapsLink: "https://maps.example.com",
      usgsLocationId: null,
    });

    await reportsService.addReport(
      {
        locationId: 2,
        date: "2024-06-02",
        catchCount: 3,
        authorId: USER_ID,
        notes: "Good day",
      },
      [],
    );

    expect(usgsQueue.add).not.toHaveBeenCalled();
  });

  it("does not queue a USGS fetch job when location is not found", async () => {
    const { usgsQueue } = require("../queue/usgs.queue");
    jest.spyOn(reportsRepo, "addReport").mockResolvedValueOnce(44);
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce(undefined);

    await reportsService.addReport(
      {
        locationId: 999,
        date: "2024-06-03",
        catchCount: 2,
        authorId: USER_ID,
        notes: "Quick stop",
      },
      [],
    );

    expect(usgsQueue.add).not.toHaveBeenCalled();
  });
});
