import { ILocation, INewLocation } from '../interfaces/location-interface';
import { queryToPromise } from './mysql-util';

export function getLocations(): Promise<ILocation[]> {
    return queryToPromise<ILocation[]>('SELECT * FROM locations');
}

export function getLocation(locationId: number): Promise<ILocation> {
    return queryToPromise<ILocation>(`SELECT 1 FROM locations
        WHERE ID = ${locationId};`
    );
}

export function addLocation(newLocation: INewLocation): Promise<ILocation> {
    return queryToPromise<ILocation>(`INSERT INTO locations(name, googleMapsLink) VALUES
        (
            "${newLocation.name}",
            "${newLocation.googleMapsLink}"
        );`
    );
}

export function deleteLocation(locationId: number): Promise<void> {
    return queryToPromise<void>(`DELETE FROM locations
        WHERE ID = ${locationId};`
    );
}

export function updateLocation(locationId: number, locationUpdate: ILocation): Promise<ILocation> {
    return queryToPromise<ILocation>(`UPDATE locations
        SET
            name = "${locationUpdate.name}",
            googleMapsLink = "${locationUpdate.googleMapsLink}"
        WHERE ID = ${locationId};`
    );
}