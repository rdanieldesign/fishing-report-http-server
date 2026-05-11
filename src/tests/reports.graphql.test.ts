import request from "supertest";
import { app, ready } from "../app";
import * as reportsRepo from "../features/reports/reports.repository";
import { db } from "../db";
import { signTestToken } from "./helpers";

// The Pothos DrizzlePlugin's ModelLoader always re-fetches via db.query.<table>.findMany
// after the resolver returns, using a DataLoader-style batch. We mock both layers:
// - the repository (for the service call in the resolver)
// - db.query.reports.findMany (for the ModelLoader's field resolution)
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
      authorId
    }
  }
`;

const MOCK_REPORT = {
  id: 1,
  locationId: 1,
  locationName: "Lake Ontario",
  date: "2024-06-01",
  catchCount: 3,
  notes: "Good day",
  authorId: USER_ID,
  authorName: "Richard",
  imageIds: null,
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

describe("allReports query", () => {
  it("returns an array of reports for an authenticated user", async () => {
    jest
      .spyOn(reportsRepo, "getReportDetails")
      .mockResolvedValueOnce([MOCK_REPORT]);
    (db.query as any).reports.findMany.mockResolvedValueOnce([MOCK_REPORT]);

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
      authorId: USER_ID,
    });
  });

  it("returns an empty array when the user has no visible reports", async () => {
    jest.spyOn(reportsRepo, "getReportDetails").mockResolvedValueOnce([]);
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
