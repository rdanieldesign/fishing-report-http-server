import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate } from "../../middleware/auth";
import { handleResponse } from "../../shared/handle-response";
import { getReportsWithMissingUsgs } from "./usgs.repository";
import { usgsQueue } from "../../queue/usgs.queue";

export const usgsRouter = Router();

usgsRouter.post("/backfill", [authenticate], (req: Request, res: Response) => {
  handleResponse(enqueueBackfillJobs(), res);
});

async function enqueueBackfillJobs(): Promise<{ enqueued: number }> {
  const missing = await getReportsWithMissingUsgs();

  const jobs = missing.map((row) => ({
    name: "fetch-usgs",
    data: {
      locationId: row.locationId,
      usgsLocationId: row.usgsLocationId,
      date: row.date,
      timezone: row.timezone,
    },
  }));

  await usgsQueue.addBulk(jobs);
  return { enqueued: jobs.length };
}
