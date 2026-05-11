import request from "supertest";
import { app } from "../app";
import * as locationsRepo from "../features/locations/locations.repository";

jest.mock("../features/locations/locations.repository");

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
});

describe("DELETE /api/locations/:id", () => {
  it("returns 200", async () => {
    jest
      .spyOn(locationsRepo, "deleteLocation")
      .mockResolvedValueOnce(undefined);

    const res = await request(app).delete("/api/locations/1");

    expect(res.status).toBe(200);
  });
});
