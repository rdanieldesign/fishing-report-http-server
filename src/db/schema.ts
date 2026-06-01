import {
  customType,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  date,
  decimal,
} from "drizzle-orm/mysql-core";

export type Coordinates = { latitude: number; longitude: number };

// MySQL returns POINT columns as its internal geometry format:
// bytes 0-3: SRID (uint32 LE), byte 4: byte order, bytes 5-8: geometry type,
// bytes 9-16: X=longitude (double LE), bytes 17-24: Y=latitude (double LE)
const point = customType<{
  data: Coordinates;
  driverData: { x: number; y: number };
}>({
  dataType() {
    return "POINT SRID 4326";
  },
  fromDriver(value: { x: number; y: number }): Coordinates {
    return { longitude: value.x, latitude: value.y };
  },
});

export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
});

export const locations = mysqlTable("locations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  usgsLocationId: varchar("usgs_location_id", { length: 50 }),
  coordinates: point("coordinates"),
});

export const reports = mysqlTable("reports", {
  id: int("id").primaryKey().autoincrement(),
  locationId: int("locationId").notNull(),
  date: date("date", { mode: "string" }).notNull(),
  catchCount: int("catchCount").notNull(),
  notes: text("notes").notNull(),
  authorId: int("authorId").notNull(),
});

export const reportImages = mysqlTable("report_images", {
  id: int("id").primaryKey().autoincrement(),
  reportId: int("reportId", { unsigned: true })
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  imageKey: varchar("imageKey", { length: 500 }),
  status: mysqlEnum(["uploading", "complete", "failed"])
    .notNull()
    .default("uploading"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const friends = mysqlTable("friends", {
  userOneId: int("userOneId").notNull(),
  userTwoId: int("userTwoId").notNull(),
  status: int("status").notNull(),
  actionUserId: int("actionUserId").notNull(),
});

export const usgsReadings = mysqlTable("usgs_readings", {
  id: varchar("id", { length: 100 }).primaryKey(),
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

export const schema = {
  users,
  locations,
  reports,
  reportImages,
  friends,
  usgsReadings,
};
