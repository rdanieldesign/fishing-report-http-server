import "dotenv/config";
import fs from "fs";
import path from "path";
import { db } from "../db";
import { dataMigrations } from "../db/schema";

async function main() {
  const migrationsDir = path.join(__dirname, "../data-migrations");

  if (!fs.existsSync(migrationsDir)) {
    console.log("No data-migrations directory, skipping.");
    process.exit(0);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".js"))
    .sort();

  const applied = await db
    .select({ name: dataMigrations.name })
    .from(dataMigrations);
  const appliedNames = new Set(applied.map((r) => r.name));

  const pending = files.filter((f) => !appliedNames.has(f));

  if (pending.length === 0) {
    console.log("No pending data migrations.");
    process.exit(0);
  }

  console.log(`Running ${pending.length} data migration(s)...`);

  for (const file of pending) {
    console.log(`  Applying ${file}...`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(path.join(migrationsDir, file)) as {
      up: () => Promise<void>;
    };
    await mod.up();
    await db.insert(dataMigrations).values({ name: file });
    console.log(`  ✓ ${file}`);
  }

  console.log("Data migrations complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Data migration failed:", err);
  process.exit(1);
});
