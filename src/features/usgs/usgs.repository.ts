import db from "../../db";
import { usgsReadings } from "../../db/schema";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { UsgsReading } from "./usgs.service";

export type UsgsReadingRow = typeof usgsReadings.$inferSelect;

export async function upsertUsgsReadings(
  locationId: number,
  readings: UsgsReading[],
): Promise<void> {
  if (readings.length === 0) return;

  const values = readings.map((r) => ({
    locationId,
    recordedAt: r.recordedAt,
    timeSlot: r.timeSlot,
    parameterCode: r.parameterCode,
    computationIdentifier: r.computationIdentifier,
    parameterName: r.parameterName,
    value: r.value,
    unit: r.unit,
  }));

  try {
    await db
      .insert(usgsReadings)
      .values(values)
      .onDuplicateKeyUpdate({
        set: {
          timeSlot: sql`VALUES(\`time_slot\`)`,
          value: sql`VALUES(\`value\`)`,
          parameterName: sql`VALUES(\`parameter_name\`)`,
          unit: sql`VALUES(\`unit\`)`,
        },
      });
  } catch (err) {
    console.error("Failed to upsert USGS readings:", err);
    throw err;
  }
}

export async function getReportsWithMissingUsgs(): Promise<
  Array<{
    locationId: number;
    date: string;
    usgsLocationId: string;
    timezone: string;
  }>
> {
  const rows = await db.execute(sql`
    SELECT DISTINCT r.locationId AS locationId, r.date,
      l.usgs_location_id AS usgsLocationId, l.timezone
    FROM reports r
    JOIN locations l ON l.id = r.locationId
    WHERE l.usgs_location_id IS NOT NULL
      AND l.timezone IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM usgs_readings ur
        WHERE ur.location_id = r.locationId
          AND DATE(ur.recorded_at) = r.date
      )
  `);
  return rows[0] as unknown as Array<{
    locationId: number;
    date: string;
    usgsLocationId: string;
    timezone: string;
  }>;
}

export async function getUsgsReadingsForDate(
  locationId: number,
  startUTC: Date,
  endUTC: Date,
): Promise<UsgsReadingRow[]> {
  return db
    .select()
    .from(usgsReadings)
    .where(
      and(
        eq(usgsReadings.locationId, locationId),
        gte(usgsReadings.recordedAt, startUTC),
        lt(usgsReadings.recordedAt, endUTC),
      ),
    )
    .orderBy(usgsReadings.timeSlot);
}
