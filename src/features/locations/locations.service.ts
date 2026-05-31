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
  const { name, googleMapsLink, usgsLocationId } = newLocation;
  return addLocationRepo({ name, googleMapsLink, usgsLocationId });
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
  const { name, googleMapsLink, usgsLocationId } = update;
  return updateLocationRepo(parseInt(locationId), {
    name,
    googleMapsLink,
    usgsLocationId,
  });
}
