import { Connection, createConnection, MysqlError } from 'mysql';
import { MYSQL_PASSWORD, MYSQL_USERNAME, MYSQL_HOST } from '../secret';

export function getDBConnection(): Connection {
    const connection = createConnection({
        host: MYSQL_HOST,
        user: MYSQL_USERNAME,
        password: MYSQL_PASSWORD,
        database: 'fishing_report',
    });
    connection.connect();
    return connection;
}

export function queryToPromise<T>(query: string): Promise<T> {
    const connection = getDBConnection();
    const request = new Promise<T>((resolve, reject) => {
        connection.query(query, function (error: MysqlError, results: T) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
    connection.end();
    return request;
}