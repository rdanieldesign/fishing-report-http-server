import { allRelations } from "./relations";
import { drizzle } from "drizzle-orm/mysql2";
import { MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USERNAME } from "../config";

export const db = drizzle({
  connection: {
    host: MYSQL_HOST,
    user: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: "fishing_report",
  },
  relations: allRelations,
});
