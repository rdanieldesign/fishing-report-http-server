import { getDBConnection, queryToPromise } from './mysql-util';

export function getLocations(): Promise<string> {
    const connection = getDBConnection();
    const request = queryToPromise<string>(connection, 'SELECT * FROM locations');
    connection.end();
    return request;
}