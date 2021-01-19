import { getLocations as getLocationsModel } from '../models/location-model';

export function getLocations(): Promise<string> {
    return getLocationsModel();
}