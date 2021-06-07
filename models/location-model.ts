import { OkPacket } from 'mysql';
import { ILocation, INewLocation } from '../interfaces/location-interface';
import { queryToPromise } from './mysql-util';

export function getLocations(): Promise<ILocation[]> {
  return queryToPromise<ILocation[]>('SELECT * FROM locations ORDER BY name;');
}

export function getLocation(locationId: number): Promise<ILocation[]> {
  return queryToPromise<ILocation[]>(`SELECT * FROM locations
        WHERE ID = ${locationId}
        LIMIT 1;`);
}

export function addLocation(newLocation: INewLocation): Promise<number> {
  return queryToPromise<OkPacket>(`INSERT INTO locations(name, googleMapsLink) VALUES
        (
            "${newLocation.name}",
            "${newLocation.googleMapsLink}"
        );`).then((results) => {
    return results.insertId;
  });
}

export function deleteLocation(locationId: number): Promise<void> {
  return queryToPromise<void>(`DELETE FROM locations
        WHERE ID = ${locationId};`);
}

export function updateLocation(
  locationId: number,
  locationUpdate: ILocation
): Promise<ILocation> {
  return queryToPromise<ILocation>(`UPDATE locations
        SET
            name = "${locationUpdate.name}",
            googleMapsLink = "${locationUpdate.googleMapsLink}"
        WHERE ID = ${locationId};`);
}
