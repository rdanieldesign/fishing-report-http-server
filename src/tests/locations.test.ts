import request from "supertest";
import { app } from "../app";
import * as locationsRepo from "../features/locations/locations.repository";
import * as reportsRepo from "../features/reports/reports.repository";

jest.mock("../features/locations/locations.repository");
jest.mock("../features/reports/reports.repository");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/locations", () => {
  it("returns 200 and an array", async () => {
    jest.spyOn(locationsRepo, "getLocations").mockResolvedValueOnce([
      {
        id: 1,
        name: "Avondale Lake",
        googleMapsLink: "https://maps.example.com",
        usgsLocationId: null,
      },
    ]);

    const res = await request(app).get("/api/locations");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("GET /api/locations/:id", () => {
  it("returns 200 and an object with id when the location exists", async () => {
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce({
      id: 1,
      name: "Avondale Lake",
      googleMapsLink: "https://maps.example.com",
      usgsLocationId: null,
    });

    const res = await request(app).get("/api/locations/1");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("id");
  });

  it("returns 200 and null when the location does not exist", async () => {
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce(undefined);

    const res = await request(app).get("/api/locations/999");

    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

describe("POST /api/locations", () => {
  it("returns 200 for a valid body", async () => {
    jest.spyOn(locationsRepo, "addLocation").mockResolvedValueOnce(1);

    const res = await request(app)
      .post("/api/locations")
      .send({ name: "New Lake", googleMapsLink: "https://maps.example.com" });

    expect(res.status).toBe(200);
  });

  it("passes usgsLocationId to the repository when provided", async () => {
    const spy = jest
      .spyOn(locationsRepo, "addLocation")
      .mockResolvedValueOnce(1);

    await request(app).post("/api/locations").send({
      name: "New Lake",
      googleMapsLink: "https://maps.example.com",
      usgsLocationId: "01234567",
    });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ usgsLocationId: "01234567" }),
    );
  });
});

describe("PUT /api/locations/:id", () => {
  it("returns 200", async () => {
    jest
      .spyOn(locationsRepo, "updateLocation")
      .mockResolvedValueOnce(undefined);

    const res = await request(app).put("/api/locations/1").send({
      name: "Updated Lake",
      googleMapsLink: "https://maps.example.com",
    });

    expect(res.status).toBe(200);
  });

  it("passes usgsLocationId to the repository when provided", async () => {
    const spy = jest
      .spyOn(locationsRepo, "updateLocation")
      .mockResolvedValueOnce(undefined);

    await request(app)
      .put("/api/locations/1")
      .send({ usgsLocationId: "01234567" });

    expect(spy).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ usgsLocationId: "01234567" }),
    );
  });
});

describe("DELETE /api/locations/:id", () => {
  it("returns 200 when no reports are associated", async () => {
    jest
      .spyOn(reportsRepo, "hasReportsByLocation")
      .mockResolvedValueOnce(false);
    jest
      .spyOn(locationsRepo, "deleteLocation")
      .mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/locations/1");

    expect(res.status).toBe(200);
  });

  it("returns 409 when reports are associated with the location", async () => {
    jest.spyOn(reportsRepo, "hasReportsByLocation").mockResolvedValueOnce(true);

    const res = await request(app).delete("/api/locations/1");

    expect(res.status).toBe(409);
    expect(locationsRepo.deleteLocation).not.toHaveBeenCalled();
  });
});
