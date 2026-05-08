// TODO: Remove this script and restore "drizzle-kit migrate" once drizzle-kit
// exits beta. It exists because drizzle-kit beta sends multi-statement migration
// files as a single query, which mysql2 rejects without multipleStatements:true.
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: "fishing_report",
    multipleStatements: true,
  });

  const db = drizzle({ client: connection });

  await migrate(db, { migrationsFolder: "./drizzle" });

  await connection.end();
  console.log("Migration complete");
}

main().catch((err) => {
  console.error("Error during migration:", err);
  process.exit(1);
});
