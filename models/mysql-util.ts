import { Connection, createConnection, QueryError, QueryResult, FieldPacket } from 'mysql2';
import { MYSQL_PASSWORD, MYSQL_USERNAME, MYSQL_HOST } from '../config';

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

export function queryToPromise<T>(query: string, values: any = []): Promise<T> {
  const connection = getDBConnection();
  const request = new Promise<T>((resolve, reject) => {
    connection.query(
      query,
      values,
      function (error: QueryError | null, results: QueryResult, _fields: FieldPacket[]) {
        if (error) {
          reject(error);
        }
        resolve(results as T);
      }
    );
  });
  connection.end();
  return request;
}

export function multiQueryToPromise<T>(query: string): Promise<T> {
  const connection = getDBConnection(true);
  const request = new Promise<T>((resolve, reject) => {
    connection.query(query, [], function (error: QueryError | null, results: QueryResult) {
      if (error) {
        reject(error);
      }
      const rows = results as any[];
      resolve(rows[rows.length - 1] as T);
    });
  });
  connection.end();
  return request;
}
