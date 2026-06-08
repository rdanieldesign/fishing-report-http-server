import "dotenv/config";
import { find } from "geo-tz";
import { and, isNotNull, isNull, eq } from "drizzle-orm";
import { db } from "../db";
import { locations } from "../db/schema";

async function main() {
  const rows = await db
    .select()
    .from(locations)
    .where(and(isNotNull(locations.coordinates), isNull(locations.timezone)));

  console.log(`Found ${rows.length} location(s) missing timezone.`);

  for (const location of rows) {
    const coords = location.coordinates!;
    const [timezone] = find(coords.latitude, coords.longitude);

    if (!timezone) {
      console.warn(
        `  [skip] location ${location.id} "${location.name}" — no timezone found for (${coords.latitude}, ${coords.longitude})`,
      );
      continue;
    }

    await db
      .update(locations)
      .set({ timezone })
      .where(eq(locations.id, location.id));

    console.log(
      `  [ok] location ${location.id} "${location.name}" → ${timezone}`,
    );
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
