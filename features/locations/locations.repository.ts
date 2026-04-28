import { asc, eq } from "drizzle-orm";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db";
import { locations } from "../../db/schema";

export type Location = InferSelectModel<typeof locations>;
export type NewLocation = Omit<InferInsertModel<typeof locations>, "id">;

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
  return db
    .insert(locations)
    .values(newLocation)
    .then((result) => result[0].insertId);
}

export function updateLocation(
  locationId: number,
  update: Partial<NewLocation>,
): Promise<void> {
  return db
    .update(locations)
    .set(update)
    .where(eq(locations.id, locationId))
    .then(() => undefined);
}

export function deleteLocation(locationId: number): Promise<void> {
  return db
    .delete(locations)
    .where(eq(locations.id, locationId))
    .then(() => undefined);
}
