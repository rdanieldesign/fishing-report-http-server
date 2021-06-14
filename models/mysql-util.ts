import { Connection, createConnection, MysqlError } from 'mysql';
import { MYSQL_PASSWORD, MYSQL_USERNAME, MYSQL_HOST } from '../secret';

export function getDBConnection(multipleStatements = false): Connection {
  const connection = createConnection({
    host: MYSQL_HOST,
    user: MYSQL_USERNAME,
    password: MYSQL_PASSWORD,
    database: 'fishing_report',
    multipleStatements,
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

export function multiQueryToPromise<T>(query: string): Promise<T> {
  const connection = getDBConnection(true);
  const request = new Promise<T>((resolve, reject) => {
    connection.query(query, function (error: MysqlError, results: any[]) {
      if (error) {
        reject(error);
      }
      resolve(results[results.length - 1] as T);
    });
  });
  connection.end();
  return request;
}
