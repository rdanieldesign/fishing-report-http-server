import { createServer, ServerResponse } from 'http';
import { getLocations } from './services/location-service';

const host = 'localhost';
const port = 3000;


const server = createServer((req, res) => {
    if (req.url == '/api/locations') {
        handleResponse(getLocations(), res);
    } else {
        res.end('Invalid request');
    }
});

server.listen(port, host, () => {
    console.log(`Server running at http://${host}:${port}/`);
});

function handleResponse<T>(responsePromise: Promise<T>, res: ServerResponse) {
    responsePromise
        .then((response: T) => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(response));
        })
        .catch((err: unknown) => {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify(err));
        })
        .finally(() => {
            res.end();
        });
}