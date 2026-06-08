import { asc, eq, sql } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { find } from "geo-tz";
import { db } from "../../db";
import { type Coordinates, locations } from "../../db/schema";

// SRID 4326 defines latitude as its first axis, so WKT must be POINT(lat lon).
function toPointSQL(coords: Coordinates) {
  return sql`ST_PointFromText(${`POINT(${coords.latitude} ${coords.longitude})`}, 4326)`;
}

export type Location = InferSelectModel<typeof locations>;
// TODO: Once all existing locations have coordinates backfilled, make the DB
// column NOT NULL, remove this override, and restore the simpler Omit<..., "id">.
export type NewLocation = Omit<
  InferInsertModel<typeof locations>,
  "id" | "coordinates"
> & {
  coordinates: Coordinates;
};

export function getLocations(): Promise<Location[]> {
  return db.select().from(locations).orderBy(asc(locations.name));
}

export function getLocation(locationId: number): Promise<Location | undefined> {
  return db
    .select()
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1)
    .then((rows) => rows[0]);
}

export function addLocation(newLocation: NewLocation): Promise<number> {
  const { coordinates, ...rest } = newLocation;
  const [timezone] = find(coordinates.latitude, coordinates.longitude);
  return db
    .insert(locations)
    .values({
      ...rest,
      coordinates: toPointSQL(coordinates) as unknown as Coordinates,
      timezone: timezone ?? null,
    })
    .then((result) => result[0].insertId);
}

export function updateLocation(
  locationId: number,
  update: Partial<NewLocation>,
): Promise<void> {
  const { coordinates, ...rest } = update;
  const set = coordinates
    ? {
        ...rest,
        coordinates: toPointSQL(coordinates) as unknown as Coordinates,
      }
    : rest;
  return db
    .update(locations)
    .set(set)
    .where(eq(locations.id, locationId))
    .then(() => undefined);
}

export function deleteLocation(locationId: number): Promise<void> {
  return db
    .delete(locations)
    .where(eq(locations.id, locationId))
    .then(() => undefined);
}
