import "dotenv/config";
import { Worker } from "bullmq";
import { REDIS_HOST, REDIS_PORT } from "../config";
import { fetchWeatherForLocation } from "../features/weather/weather.service";
import { upsertWeatherReadings } from "../features/weather/weather.repository";

export interface WeatherJobData {
  locationId: number;
  coordinates: { latitude: number; longitude: number };
  startDate: string;
  endDate: string;
}

const worker = new Worker<WeatherJobData>(
  "weather",
  async (job) => {
    const { locationId, coordinates, startDate, endDate } = job.data;
    const rows = await fetchWeatherForLocation(coordinates, startDate, endDate);
    await upsertWeatherReadings(locationId, rows);
  },
  { connection: { host: REDIS_HOST, port: REDIS_PORT } },
);

worker.on("failed", (job, err) => {
  console.error(`Weather job ${job?.id} failed:`, err.message);
});
