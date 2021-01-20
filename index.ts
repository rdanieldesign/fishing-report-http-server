import { ServerResponse } from 'http';
import { addLocation, deleteLocation, getLocations, updateLocation } from './services/location-service';
import express from 'express';
import { json } from 'body-parser';

const host = 'localhost';
const port = 3000;
const app = express();

app.use(json());

app.get('/api/locations', (req, res) => {
    handleResponse(getLocations(), res);
});

app.post('/api/locations', (req, res) => {
    handleResponse(addLocation(req.body), res);
});

app.delete('/api/locations/:locationId', (req, res) => {
    handleResponse(deleteLocation(req.params.locationId), res);
});

app.put('/api/locations/:locationId', (req, res) => {
    handleResponse(updateLocation(req.params.locationId, req.body), res);
});

app.listen(port, () => {
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