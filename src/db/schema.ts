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
  unique,
} from "drizzle-orm/mysql-core";

export type Coordinates = { latitude: number; longitude: number };

// mysql2 returns POINT as { x, y } using Cartesian convention: x = longitude, y = latitude.
const point = customType<{
  data: Coordinates;
  driverData: { x: number; y: number };
}>({
  dataType() {
    return "POINT SRID 4326";
  },
  fromDriver(value: { x: number; y: number }): Coordinates {
    return { latitude: value.y, longitude: value.x };
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
  timezone: varchar("timezone", { length: 50 }),
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

export const weatherDaily = mysqlTable(
  "weather_daily",
  {
    id: int("id").primaryKey().autoincrement(),
    locationId: int("location_id", { unsigned: true })
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    tempMax: decimal("temp_max", { precision: 5, scale: 2 }),
    tempMin: decimal("temp_min", { precision: 5, scale: 2 }),
    tempMean: decimal("temp_mean", { precision: 5, scale: 2 }),
    precipitationSum: decimal("precipitation_sum", { precision: 6, scale: 3 }),
    weatherCode: int("weather_code"),
    windSpeedMax: decimal("wind_speed_max", { precision: 6, scale: 2 }),
    cloudCoverMin: decimal("cloud_cover_min", { precision: 5, scale: 2 }),
    cloudCoverMax: decimal("cloud_cover_max", { precision: 5, scale: 2 }),
    cloudCoverMean: decimal("cloud_cover_mean", { precision: 5, scale: 2 }),
  },
  (table) => [unique("location_date_unique").on(table.locationId, table.date)],
);

export const schema = {
  users,
  locations,
  reports,
  reportImages,
  friends,
  usgsReadings,
  weatherDaily,
};
