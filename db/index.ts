import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { MYSQL_HOST, MYSQL_PASSWORD, MYSQL_USERNAME } from "../config";
import * as schema from "./schema";

const pool = mysql.createPool({
  host: MYSQL_HOST,
  user: MYSQL_USERNAME,
  password: MYSQL_PASSWORD,
  database: "fishing_report",
});

export const db = drizzle(pool, { schema, mode: "default" });
