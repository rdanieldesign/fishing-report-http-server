import { ILocation, INewLocation } from '../interfaces/location-interface';
import {
    getLocations as getLocationsModel,
    addLocation as addLocationModel,
    deleteLocation as deleteLocationModel,
    updateLocation as updateLocationModel,
} from '../models/location-model';

export function getLocations(): Promise<ILocation[]> {
    return getLocationsModel();
}

export function addLocation(newLocation: INewLocation): Promise<ILocation> {
    return addLocationModel(newLocation);
}

export function deleteLocation(locationId: string): Promise<void> {
    return deleteLocationModel(parseInt(locationId));
}

export function updateLocation(locationId: string, locationUpdate: ILocation): Promise<ILocation> {
    return updateLocationModel(parseInt(locationId), locationUpdate);
}