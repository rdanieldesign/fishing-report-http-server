import { and, between, eq, sql } from "drizzle-orm";
import { db } from "../../db";
import { weatherDaily } from "../../db/schema";
import type { WeatherDailyRow } from "./weather.service";

export type WeatherDaily = typeof weatherDaily.$inferSelect;

export async function upsertWeatherReadings(
  locationId: number,
  rows: WeatherDailyRow[],
): Promise<void> {
  if (rows.length === 0) return;

  const values = rows.map((r) => ({
    locationId,
    date: r.date,
    tempMax: r.tempMax,
    tempMin: r.tempMin,
    tempMean: r.tempMean,
    precipitationSum: r.precipitationSum,
    weatherCode: r.weatherCode,
    windSpeedMax: r.windSpeedMax,
    cloudCoverMin: r.cloudCoverMin,
    cloudCoverMax: r.cloudCoverMax,
    cloudCoverMean: r.cloudCoverMean,
  }));

  try {
    await db
      .insert(weatherDaily)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          tempMax: sql`VALUES(\`temp_max\`)`,
          tempMin: sql`VALUES(\`temp_min\`)`,
          tempMean: sql`VALUES(\`temp_mean\`)`,
          precipitationSum: sql`VALUES(\`precipitation_sum\`)`,
          weatherCode: sql`VALUES(\`weather_code\`)`,
          windSpeedMax: sql`VALUES(\`wind_speed_max\`)`,
          cloudCoverMin: sql`VALUES(\`cloud_cover_min\`)`,
          cloudCoverMax: sql`VALUES(\`cloud_cover_max\`)`,
          cloudCoverMean: sql`VALUES(\`cloud_cover_mean\`)`,
        },
      });
  } catch (err) {
    console.error("Failed to upsert weather readings:", err);
    throw err;
  }
}

export async function getWeatherForDateRange(
  locationId: number,
  startDate: string,
  endDate: string,
): Promise<WeatherDaily[]> {
  return db
    .select()
    .from(weatherDaily)
    .where(
      and(
        eq(weatherDaily.locationId, locationId),
        between(weatherDaily.date, startDate, endDate),
      ),
    )
    .orderBy(weatherDaily.date);
}

export async function getReportsWithMissingWeather(): Promise<
  Array<{
    locationId: number;
    date: string;
    coordinates: { latitude: number; longitude: number };
  }>
> {
  const rows = await db.execute(sql`
    SELECT DISTINCT r.locationId AS locationId, r.date,
      ST_X(l.coordinates) AS lng, ST_Y(l.coordinates) AS lat
    FROM reports r
    JOIN locations l ON l.id = r.locationId
    WHERE l.coordinates IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM weather_daily wd
        WHERE wd.location_id = r.locationId AND wd.date = r.date
      )
  `);
  return (
    rows[0] as unknown as Array<{
      locationId: number;
      date: string;
      lat: number;
      lng: number;
    }>
  ).map((row) => ({
    locationId: row.locationId,
    date: row.date,
    coordinates: { latitude: row.lat, longitude: row.lng },
  }));
}
