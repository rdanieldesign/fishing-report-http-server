import {
  int,
  mysqlTable,
  text,
  varchar,
  date,
  decimal,
} from "drizzle-orm/mysql-core";

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
  usgsLocationId: varchar("usgs_location_id", { length: 50 }),
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

export const usgsReadings = mysqlTable("usgs_readings", {
  id: varchar("id", { length: 100 }).notNull(),
  postId: int("post_id", { unsigned: true })
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  parameterCode: varchar("parameter_code", { length: 10 }).notNull(),
  computationIdentifier: varchar("computation_identifier", {
    length: 100,
  }).notNull(),
  parameterName: varchar("parameter_name", { length: 100 }).notNull(),
  value: decimal("value", { precision: 12, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull(),
});

export const schema = { users, locations, reports, friends, usgsReadings };
