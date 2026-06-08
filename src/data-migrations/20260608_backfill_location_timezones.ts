import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { find } from "geo-tz";
import { db } from "../db";
import { locations } from "../db/schema";

export async function up(): Promise<void> {
  const rows = await db
    .select()
    .from(locations)
    .where(and(isNotNull(locations.coordinates), isNull(locations.timezone)));

  console.log(`    Found ${rows.length} location(s) missing timezone.`);

  for (const location of rows) {
    const coords = location.coordinates!;
    const [timezone] = find(coords.latitude, coords.longitude);
    if (!timezone) {
      console.warn(
        `    [skip] location ${location.id} "${location.name}" — no timezone found`,
      );
      continue;
    }
    await db
      .update(locations)
      .set({ timezone })
      .where(eq(locations.id, location.id));
    console.log(`    location ${location.id} "${location.name}" → ${timezone}`);
  }
}
