import { ILocation, INewLocation } from "../interfaces/location-interface";
import {
  getLocations as getLocationsModel,
  addLocation as addLocationModel,
  deleteLocation as deleteLocationModel,
  updateLocation as updateLocationModel,
  getLocation as getLocationModel,
} from "../models/location-model";

export function getLocations(): Promise<ILocation[]> {
  return getLocationsModel();
}

export function getLocation(locationId: string): Promise<ILocation | null> {
  return getLocationModel(parseInt(locationId)).then(
    (res: ILocation[]): ILocation | null => {
      if (res && res[0]) {
        return res[0];
      } else {
        return null;
      }
    }
  );
}

export function addLocation(newLocation: INewLocation): Promise<number> {
  return addLocationModel(newLocation);
}

export function deleteLocation(locationId: string): Promise<void> {
  return deleteLocationModel(parseInt(locationId));
}

export function updateLocation(
  locationId: string,
  locationUpdate: ILocation
): Promise<ILocation> {
  return updateLocationModel(parseInt(locationId), locationUpdate);
}
