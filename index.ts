import { ServerResponse } from 'http';
import { addLocation, deleteLocation, getLocation, getLocations, updateLocation } from './services/location-service';
import express from 'express';
import { json } from 'body-parser';
import { addReport, deleteReport, getReports, updateReport, getReport } from './services/report-service';
import { addUser } from './services/user-service';

const host = 'localhost';
const port = 3000;
const app = express();

app.use(json());

// LOCATIONS

app.get('/api/locations', (req, res) => {
    handleResponse(getLocations(), res);
});

app.get('/api/locations/:locationId', (req, res) => {
    handleResponse(getLocation(req.params.locationId), res);
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

// REPORTS

app.get('/api/reports', (req, res) => {
    handleResponse(getReports(req.query), res);
});

app.get('/api/reports/:reportId', (req, res) => {
    handleResponse(getReport(req.params.reportId), res);
});

app.post('/api/reports', (req, res) => {
    handleResponse(addReport(req.body), res);
});

app.put('/api/reports/:reportId', (req, res) => {
    handleResponse(updateReport(req.params.reportId, req.body), res);
});

app.delete('/api/reports/:reportId', (req, res) => {
    handleResponse(deleteReport(req.params.reportId), res);
});

// USERS
app.post('/api/users', (req, res) => {
    console.log('here');
    handleResponse(addUser(req.body), res);
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