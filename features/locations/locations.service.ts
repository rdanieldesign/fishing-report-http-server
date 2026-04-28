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
  return addLocationRepo(newLocation);
}

export function deleteLocation(locationId: string): Promise<void> {
  return deleteLocationRepo(parseInt(locationId));
}

export function updateLocation(
  locationId: string,
  update: Partial<NewLocation>,
): Promise<void> {
  return updateLocationRepo(parseInt(locationId), update);
}
