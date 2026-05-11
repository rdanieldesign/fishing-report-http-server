import db from "../../db";
import { usgsReadings } from "../../db/schema";
import { sql } from "drizzle-orm";
import { UsgsReading } from "./usgs.service";

export async function insertUsgsReadings(
  postId: number,
  readings: UsgsReading[],
): Promise<void> {
  if (readings.length === 0) {
    return;
  }

  const valuesToInsert = readings.map((r) => ({
    id: `${r.id}-${postId}`,
    postId,
    parameterCode: r.parameterCode,
    computationIdentifier: r.computationIdentifier,
    parameterName: r.parameterName,
    value: r.value,
    unit: r.unit,
  }));

  try {
    await db
      .insert(usgsReadings)
      .values(valuesToInsert)
      .onDuplicateKeyUpdate({
        set: {
          value: sql`VALUES(\`value\`)`,
          parameterName: sql`VALUES(\`parameter_name\`)`,
          unit: sql`VALUES(\`unit\`)`,
        },
      });
  } catch (err) {
    console.error("Failed to insert USGS readings:", err);
    throw err;
  }
}
