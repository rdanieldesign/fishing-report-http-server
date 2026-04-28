import { int, mysqlTable, text, varchar, date } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
});

export const locations = mysqlTable("locations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  googleMapsLink: varchar("googleMapsLink", { length: 500 }).notNull(),
});

export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  locationId: int("locationId").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  catchCount: int("catchCount").notNull(),
  notes: text("notes").notNull(),
  authorId: int("authorId").notNull(),
  imageIds: text("imageIds"),
});

export const friends = mysqlTable("friends", {
  userOneId: int("userOneId").notNull(),
  userTwoId: int("userTwoId").notNull(),
  status: int("status").notNull(),
  actionUserId: int("actionUserId").notNull(),
});
