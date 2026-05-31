import request from "supertest";
import { app, ready } from "../app";
import * as reportsRepo from "../features/reports/reports.repository";
import { db } from "../db";
import { signTestToken } from "./helpers";

function encodeCursor(date: string, id: number): string {
  return Buffer.from(JSON.stringify({ date, id })).toString("base64");
}

jest.mock("../features/reports/reports.repository");
jest.mock("../db", () => ({
  db: {
    query: {
      reports: {
        findMany: jest.fn(),
      },
    },
  },
}));

const USER_ID = 1;
const token = signTestToken(USER_ID);

const ALL_REPORTS_QUERY = `
  query {
    allReports {
      id
      date
      catchCount
      notes
      author {
        id
      }
    }
  }
`;

const MOCK_DB_REPORT = {
  id: 1,
  locationId: 1,
  date: "2024-06-01",
  catchCount: 3,
  notes: "Good day",
  authorId: USER_ID,
  author: {
    id: USER_ID,
    name: "Richard",
    email: "r@example.com",
    password: "",
  },
  location: {
    id: 1,
    name: "Blue Creek",
    googleMapsLink: "https://maps.google.com/?q=blue-creek",
    usgsLocationId: null,
  },
};

beforeAll(async () => {
  await ready;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Authentication middleware — POST /graphql", () => {
  it("returns 401 with no token", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({ query: ALL_REPORTS_QUERY });

    expect(res.status).toBe(401);
  });

  it("returns 401 with an invalid token", async () => {
    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", "invalid-token")
      .send({ query: ALL_REPORTS_QUERY });

    expect(res.status).toBe(401);
  });
});

const TOP_LOCATION_QUERY = `
  query {
    topLocationByCurrentMonth {
      locationId
      locationName
      locationGoogleMapsLink
      totalCatchCount
      month
    }
  }
`;

describe("topLocationByCurrentMonth query", () => {
  it("returns the top location when data exists", async () => {
    jest
      .spyOn(reportsRepo, "getTopLocationByCurrentMonth")
      .mockResolvedValueOnce({
        locationId: 2,
        locationName: "Blue Creek",
        locationGoogleMapsLink: "https://maps.google.com/?q=blue-creek",
        totalCatchCount: 14,
        month: 5,
      });

    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: TOP_LOCATION_QUERY });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.topLocationByCurrentMonth).toMatchObject({
      locationId: 2,
      locationName: "Blue Creek",
      totalCatchCount: 14,
      month: 5,
    });
  });

  it("returns null when no historical data exists for this month", async () => {
    jest
      .spyOn(reportsRepo, "getTopLocationByCurrentMonth")
      .mockResolvedValueOnce(undefined);

    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: TOP_LOCATION_QUERY });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.topLocationByCurrentMonth).toBeNull();
  });

  it("passes the current user ID to the repository", async () => {
    const spy = jest
      .spyOn(reportsRepo, "getTopLocationByCurrentMonth")
      .mockResolvedValueOnce(undefined);

    await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: TOP_LOCATION_QUERY });

    expect(spy).toHaveBeenCalledWith(USER_ID);
  });
});

describe("allReports query", () => {
  it("returns an array of reports for an authenticated user", async () => {
    jest
      .spyOn(reportsRepo, "getReportsGQL")
      .mockResolvedValueOnce([MOCK_DB_REPORT]);
    (db.query as any).reports.findMany.mockResolvedValueOnce([MOCK_DB_REPORT]);

    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: ALL_REPORTS_QUERY });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.allReports).toHaveLength(1);
    expect(res.body.data.allReports[0]).toMatchObject({
      id: 1,
      date: "2024-06-01",
      catchCount: 3,
      notes: "Good day",
      author: { id: USER_ID },
    });
  });

  it("returns an empty array when the user has no visible reports", async () => {
    jest.spyOn(reportsRepo, "getReportsGQL").mockResolvedValueOnce([]);
    (db.query as any).reports.findMany.mockResolvedValueOnce([]);

    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: ALL_REPORTS_QUERY });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.allReports).toEqual([]);
  });
});

const PAGINATED_REPORTS_QUERY = `
  query PaginatedReports($cursor: String, $limit: Int) {
    paginatedReports(cursor: $cursor, limit: $limit) {
      reports {
        id
        date
        catchCount
        notes
        author {
          id
        }
      }
      nextCursor
    }
  }
`;

describe("paginatedReports query", () => {
  it("returns the first page with no cursor", async () => {
    jest
      .spyOn(reportsRepo, "getPaginatedReportsGQL")
      .mockResolvedValueOnce({ reports: [MOCK_DB_REPORT], nextCursor: null });

    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: PAGINATED_REPORTS_QUERY });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.paginatedReports.reports).toHaveLength(1);
    expect(res.body.data.paginatedReports.reports[0]).toMatchObject({
      id: 1,
      date: "2024-06-01",
      catchCount: 3,
      notes: "Good day",
      author: { id: USER_ID },
    });
    expect(res.body.data.paginatedReports.nextCursor).toBeNull();
  });

  it("returns nextCursor when more pages exist", async () => {
    const cursor = encodeCursor("2024-06-01", 1);
    jest
      .spyOn(reportsRepo, "getPaginatedReportsGQL")
      .mockResolvedValueOnce({ reports: [MOCK_DB_REPORT], nextCursor: cursor });

    const res = await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({ query: PAGINATED_REPORTS_QUERY });

    expect(res.status).toBe(200);
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.paginatedReports.nextCursor).toBe(cursor);
  });

  it("passes cursor and limit args to the repository", async () => {
    const cursor = encodeCursor("2024-06-01", 1);
    const spy = jest
      .spyOn(reportsRepo, "getPaginatedReportsGQL")
      .mockResolvedValueOnce({ reports: [], nextCursor: null });

    await request(app)
      .post("/graphql")
      .set("x-access-token", token)
      .send({
        query: PAGINATED_REPORTS_QUERY,
        variables: { cursor, limit: 10 },
      });

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ cursor, limit: 10 }),
      USER_ID,
    );
  });

  it("returns 401 without a token", async () => {
    const res = await request(app)
      .post("/graphql")
      .send({ query: PAGINATED_REPORTS_QUERY });

    expect(res.status).toBe(401);
  });
});
