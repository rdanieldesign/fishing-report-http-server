import { Queue } from "bullmq";
import { REDIS_HOST, REDIS_PORT } from "../config";

export const weatherQueue = new Queue("weather", {
  connection: { host: REDIS_HOST, port: REDIS_PORT },
});
