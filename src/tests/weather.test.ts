import request from "supertest";
import { app } from "../app";
import * as reportsRepo from "../features/reports/reports.repository";
import * as locationsRepo from "../features/locations/locations.repository";
import * as weatherRepo from "../features/weather/weather.repository";
import * as weatherService from "../features/weather/weather.service";
import { signTestToken } from "./helpers";

jest.mock("../features/reports/reports.repository");
jest.mock("../features/locations/locations.repository");
jest.mock("../features/weather/weather.repository");
jest.mock("../queue/weather.queue");
jest.mock("../queue/usgs.queue");

const USER_ID = 1;
const token = signTestToken(USER_ID);

const MOCK_REPORT = {
  id: 1,
  authorId: USER_ID,
  locationId: 10,
  date: "2024-06-10",
};
const MOCK_COORDS = { latitude: 40.7128, longitude: -74.006 };
const MOCK_LOCATION = {
  id: 10,
  name: "Test Lake",
  usgsLocationId: null,
  coordinates: MOCK_COORDS,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// POST /api/reports/:id/weather
// ---------------------------------------------------------------------------

describe("POST /api/reports/:id/weather", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/reports/1/weather");
    expect(res.status).toBe(401);
  });

  it("returns 200 and enqueues a weather job when user owns the report", async () => {
    const { weatherQueue } = require("../queue/weather.queue");
    jest
      .spyOn(reportsRepo, "getReportByIdForOwnership")
      .mockResolvedValueOnce(MOCK_REPORT as any);
    jest
      .spyOn(locationsRepo, "getLocation")
      .mockResolvedValueOnce(MOCK_LOCATION as any);

    const res = await request(app)
      .post("/api/reports/1/weather")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(weatherQueue.add).toHaveBeenCalledWith("fetch-weather", {
      locationId: MOCK_REPORT.locationId,
      coordinates: MOCK_COORDS,
      startDate: "2024-06-06",
      endDate: "2024-06-10",
    });
  });

  it("returns 200 but does not enqueue when location has no coordinates", async () => {
    const { weatherQueue } = require("../queue/weather.queue");
    jest
      .spyOn(reportsRepo, "getReportByIdForOwnership")
      .mockResolvedValueOnce(MOCK_REPORT as any);
    jest.spyOn(locationsRepo, "getLocation").mockResolvedValueOnce({
      ...MOCK_LOCATION,
      coordinates: null,
    } as any);

    const res = await request(app)
      .post("/api/reports/1/weather")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(weatherQueue.add).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not own the report", async () => {
    jest
      .spyOn(reportsRepo, "getReportByIdForOwnership")
      .mockResolvedValueOnce({ ...MOCK_REPORT, authorId: 999 } as any);

    const res = await request(app)
      .post("/api/reports/1/weather")
      .set("x-access-token", token);

    expect(res.status).toBe(403);
  });

  it("returns 403 when the report does not exist", async () => {
    jest
      .spyOn(reportsRepo, "getReportByIdForOwnership")
      .mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/api/reports/99/weather")
      .set("x-access-token", token);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/weather/backfill
// ---------------------------------------------------------------------------

describe("POST /api/weather/backfill", () => {
  it("returns 401 without a token", async () => {
    const res = await request(app).post("/api/weather/backfill");
    expect(res.status).toBe(401);
  });

  it("returns 200 and reports how many jobs were enqueued", async () => {
    const { weatherQueue } = require("../queue/weather.queue");
    jest
      .spyOn(weatherRepo, "getReportsWithMissingWeather")
      .mockResolvedValueOnce([
        { locationId: 10, date: "2024-06-10", coordinates: MOCK_COORDS },
        { locationId: 10, date: "2024-06-08", coordinates: MOCK_COORDS },
      ]);

    const res = await request(app)
      .post("/api/weather/backfill")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body.enqueued).toBe(2);
    expect(weatherQueue.addBulk).toHaveBeenCalledWith([
      {
        name: "fetch-weather",
        data: {
          locationId: 10,
          coordinates: MOCK_COORDS,
          startDate: "2024-06-06",
          endDate: "2024-06-10",
        },
      },
      {
        name: "fetch-weather",
        data: {
          locationId: 10,
          coordinates: MOCK_COORDS,
          startDate: "2024-06-04",
          endDate: "2024-06-08",
        },
      },
    ]);
  });

  it("returns 200 with enqueued=0 when nothing is missing", async () => {
    const { weatherQueue } = require("../queue/weather.queue");
    jest
      .spyOn(weatherRepo, "getReportsWithMissingWeather")
      .mockResolvedValueOnce([]);

    const res = await request(app)
      .post("/api/weather/backfill")
      .set("x-access-token", token);

    expect(res.status).toBe(200);
    expect(res.body.enqueued).toBe(0);
    expect(weatherQueue.addBulk).toHaveBeenCalledWith([]);
  });
});

// ---------------------------------------------------------------------------
// weather.service: fetchWeatherForLocation
// ---------------------------------------------------------------------------

describe("fetchWeatherForLocation", () => {
  function makeMockVariables(values: number[]) {
    return { valuesArray: () => Float32Array.from(values) };
  }

  function makeMockResponse(opts: {
    utcOffset?: number;
    dailyTime?: bigint;
    dailyTimeEnd?: bigint;
    dailyInterval?: number;
    tempMax?: number[];
    tempMin?: number[];
    tempMean?: number[];
    precip?: number[];
    weatherCode?: number[];
    windSpeed?: number[];
    hourlyTime?: bigint;
    hourlyTimeEnd?: bigint;
    hourlyInterval?: number;
    cloudCover?: number[];
  }) {
    const {
      utcOffset = 0,
      dailyTime = BigInt(0),
      dailyTimeEnd = BigInt(86400),
      dailyInterval = 86400,
      tempMax = [75],
      tempMin = [55],
      tempMean = [65],
      precip = [0.25],
      weatherCode = [80],
      windSpeed = [12.5],
      hourlyTime = BigInt(0),
      hourlyTimeEnd = BigInt(24 * 3600),
      hourlyInterval = 3600,
      cloudCover = Array(24).fill(50),
    } = opts;

    return {
      utcOffsetSeconds: () => utcOffset,
      daily: () => ({
        time: () => dailyTime,
        timeEnd: () => dailyTimeEnd,
        interval: () => dailyInterval,
        variables: (i: number) =>
          makeMockVariables(
            [tempMax, tempMin, tempMean, precip, weatherCode, windSpeed][i],
          ),
      }),
      hourly: () => ({
        time: () => hourlyTime,
        timeEnd: () => hourlyTimeEnd,
        interval: () => hourlyInterval,
        variables: (_i: number) => makeMockVariables(cloudCover),
      }),
    };
  }

  beforeEach(() => {
    jest.resetModules();
  });

  it("maps daily API data to WeatherDailyRow", async () => {
    jest.mock("openmeteo", () => ({
      fetchWeatherApi: jest.fn().mockResolvedValue([
        makeMockResponse({
          dailyTime: BigInt(0),
          dailyTimeEnd: BigInt(86400),
          dailyInterval: 86400,
          tempMax: [75.5],
          tempMin: [55.2],
          tempMean: [65.3],
          precip: [0.125],
          weatherCode: [61],
          windSpeed: [8.75],
          cloudCover: Array(24).fill(60),
        }),
      ]),
    }));

    const { fetchWeatherForLocation } =
      await import("../features/weather/weather.service");
    const rows = await fetchWeatherForLocation(
      MOCK_COORDS,
      "1970-01-01",
      "1970-01-01",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].tempMax).toBe("75.50");
    expect(rows[0].tempMin).toBe("55.20");
    expect(rows[0].tempMean).toBe("65.30");
    expect(rows[0].precipitationSum).toBe("0.125");
    expect(rows[0].weatherCode).toBe(61);
    expect(rows[0].windSpeedMax).toBe("8.75");
  });

  it("computes cloud cover min/max/mean from hourly values", async () => {
    // 24 hourly values for one day: all 0 except one spike at 100
    const hourlyValues = Array(24).fill(0);
    hourlyValues[12] = 100;

    jest.mock("openmeteo", () => ({
      fetchWeatherApi: jest
        .fn()
        .mockResolvedValue([makeMockResponse({ cloudCover: hourlyValues })]),
    }));

    const { fetchWeatherForLocation } =
      await import("../features/weather/weather.service");
    const rows = await fetchWeatherForLocation(
      MOCK_COORDS,
      "1970-01-01",
      "1970-01-01",
    );

    expect(rows[0].cloudCoverMin).toBe("0.00");
    expect(rows[0].cloudCoverMax).toBe("100.00");
    const expectedMean = (100 / 24).toFixed(2);
    expect(rows[0].cloudCoverMean).toBe(expectedMean);
  });

  it("returns null for cloud cover fields when no hourly data maps to the day", async () => {
    // Hourly data for a different day (time offset puts them out of the daily range)
    // Simulate by using an hourly time that doesn't overlap with the daily date
    const secondsDayTwo = BigInt(86400);
    const secondsDayThree = BigInt(86400 * 2);

    jest.mock("openmeteo", () => ({
      fetchWeatherApi: jest.fn().mockResolvedValue([
        makeMockResponse({
          hourlyTime: secondsDayTwo,
          hourlyTimeEnd: secondsDayThree,
          cloudCover: Array(24).fill(80),
        }),
      ]),
    }));

    const { fetchWeatherForLocation } =
      await import("../features/weather/weather.service");
    const rows = await fetchWeatherForLocation(
      MOCK_COORDS,
      "1970-01-01",
      "1970-01-01",
    );

    expect(rows[0].cloudCoverMin).toBeNull();
    expect(rows[0].cloudCoverMax).toBeNull();
    expect(rows[0].cloudCoverMean).toBeNull();
  });
});
