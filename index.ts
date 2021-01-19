import { createServer } from 'http';
import { createConnection, Connection, MysqlError } from 'mysql';

const host = 'localhost';
const port = 3000;


const server = createServer((req, res) => {
    const dbConnection = getDBConnection();
    if (req.url == '/api/locations') {
        queryToPromise(dbConnection, 'SELECT * FROM locations')
            .then((response) => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(response));
            })
            .catch((err) => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(err));
            })
            .finally(() => {
                dbConnection.end();
                res.end();
            });
    } else {
        res.end('Invalid request');
        dbConnection.end();
    }
});

server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});

function getDBConnection(): Connection {
    const connection = createConnection({
        host,
        user: 'rdanieldesign',
        password: process.argv[2],
        database: 'fishing_report',
    });
    connection.connect();
    return connection;
}

function queryToPromise<T>(connection: Connection, query: string): Promise<T> {
    return new Promise((resolve, reject) => {
        connection.query(query, function (error: MysqlError, results: T) {
            if (error) {
                reject(error);
            }
            resolve(results);
        });
    });
}