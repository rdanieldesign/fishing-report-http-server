import { Queue } from "bullmq";
import { REDIS_HOST, REDIS_PORT } from "../config";

export const usgsQueue = new Queue("usgs", {
  connection: { host: REDIS_HOST, port: REDIS_PORT },
});
