import { Connection, createConnection, MysqlError } from 'mysql';

export function getDBConnection(): Connection {
    const connection = createConnection({
        host: 'localhost',
        user: 'rdanieldesign',
        password: process.argv[2],
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