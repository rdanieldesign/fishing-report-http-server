import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate } from "../../middleware/auth";
import { handleResponse } from "../../shared/handle-response";
import { getReportsWithMissingWeather } from "./weather.repository";
import { weatherQueue } from "../../queue/weather.queue";

export const weatherRouter = Router();

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

weatherRouter.post(
  "/backfill",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(enqueueBackfillJobs(), res);
  },
);

async function enqueueBackfillJobs(): Promise<{ enqueued: number }> {
  const missing = await getReportsWithMissingWeather();

  const jobs = missing.map((row) => ({
    name: "fetch-weather",
    data: {
      locationId: row.locationId,
      coordinates: row.coordinates,
      startDate: subtractDays(row.date, 4),
      endDate: row.date,
    },
  }));

  await weatherQueue.addBulk(jobs);
  return { enqueued: jobs.length };
}
