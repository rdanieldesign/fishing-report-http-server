import "dotenv/config";
import { Worker } from "bullmq";
import { REDIS_HOST, REDIS_PORT } from "../config";
import { fetchUsgsReadings } from "../features/usgs/usgs.service";
import { insertUsgsReadings } from "../features/usgs/usgs.repository";

export interface UsgsJobData {
  postId: number;
  usgsLocationId: string;
  reportDate: string;
}

const worker = new Worker<UsgsJobData>(
  "usgs",
  async (job) => {
    const { postId, usgsLocationId, reportDate } = job.data;
    const readings = await fetchUsgsReadings(usgsLocationId, reportDate);
    await insertUsgsReadings(postId, readings);
  },
  { connection: { host: REDIS_HOST, port: REDIS_PORT } },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});
