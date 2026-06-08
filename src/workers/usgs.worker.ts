import "dotenv/config";
import { Worker } from "bullmq";
import { REDIS_HOST, REDIS_PORT } from "../config";
import { fetchUsgsReadings } from "../features/usgs/usgs.service";
import { upsertUsgsReadings } from "../features/usgs/usgs.repository";

export interface UsgsJobData {
  locationId: number;
  usgsLocationId: string;
  date: string;
  timezone: string;
}

const worker = new Worker<UsgsJobData>(
  "usgs",
  async (job) => {
    const { locationId, usgsLocationId, date, timezone } = job.data;
    const readings = await fetchUsgsReadings(usgsLocationId, date, timezone);
    await upsertUsgsReadings(locationId, readings);
  },
  { connection: { host: REDIS_HOST, port: REDIS_PORT } },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
