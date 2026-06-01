import { hasReportsByLocation } from "../reports/reports.repository";
import {
  addLocation as addLocationRepo,
  deleteLocation as deleteLocationRepo,
  getLocation as getLocationRepo,
  getLocations as getLocationsRepo,
  updateLocation as updateLocationRepo,
  type Location,
  type NewLocation,
} from "./locations.repository";

export function getLocations(): Promise<Location[]> {
  return getLocationsRepo();
}

export function getLocation(locationId: string): Promise<Location | null> {
  return getLocationRepo(parseInt(locationId)).then((row) => row ?? null);
}

export function addLocation(newLocation: NewLocation): Promise<number> {
  const { name, usgsLocationId, coordinates } = newLocation;
  return addLocationRepo({ name, usgsLocationId, coordinates });
}

export async function deleteLocation(locationId: string): Promise<void> {
  const id = parseInt(locationId);
  const hasReports = await hasReportsByLocation(id);
  if (hasReports) {
    throw {
      status: 409,
      message: "Cannot delete a location with associated reports",
    };
  }
  return deleteLocationRepo(id);
}

export function updateLocation(
  locationId: string,
  update: Partial<NewLocation>,
): Promise<void> {
  const { name, usgsLocationId, coordinates } = update;
  return updateLocationRepo(parseInt(locationId), {
    name,
    usgsLocationId,
    coordinates,
  });
}
