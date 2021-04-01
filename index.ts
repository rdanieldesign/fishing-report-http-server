import { ServerResponse } from 'http';
import { addLocation, deleteLocation, getLocation, getLocations, updateLocation } from './services/location-service';
import express from 'express';
import { json } from 'body-parser';
import { addReport, deleteReport, getReports, updateReport, getReport } from './services/report-service';
import { login, signUp, verifyToken } from './services/auth-service';
import { IVerifiedTokenResponse } from './interfaces/auth-interface';
import { NextFunction, Request } from 'express-serve-static-core';

const host = 'localhost';
const port = 3000;
const app = express();

app.use(json());

// LOCATIONS

app.get('/api/locations', (req: Request, res: ServerResponse) => {
    handleResponse(getLocations(), res);
});

app.get('/api/locations/:locationId', (req: Request, res: ServerResponse) => {
    handleResponse(getLocation(req.params.locationId), res);
});

app.post('/api/locations', (req: Request, res: ServerResponse) => {
    handleResponse(addLocation(req.body), res);
});

app.delete('/api/locations/:locationId', (req: Request, res: ServerResponse) => {
    handleResponse(deleteLocation(req.params.locationId), res);
});

app.put('/api/locations/:locationId', (req: Request, res: ServerResponse) => {
    handleResponse(updateLocation(req.params.locationId, req.body), res);
});

// REPORTS

app.get('/api/reports', (req: Request, res: ServerResponse) => {
    handleResponse(getReports(req.query), res);
});

app.get('/api/reports/:reportId', (req: Request, res: ServerResponse) => {
    handleResponse(getReport(req.params.reportId), res);
});

app.post(
    '/api/reports',
    [authenticate],
    (req: Request, res: ServerResponse) => {
        handleResponse(addReport({ ...req.body, authorId: req.body.userId }), res);
    },
);

app.put(
    '/api/reports/:reportId',
    [authenticate],
    (req: Request, res: ServerResponse) => {
        handleResponse(updateReport(req.params.reportId, req.body), res);
    },
);

app.delete(
    '/api/reports/:reportId',
    [authenticate],
    (req: Request, res: ServerResponse) => {
        handleResponse(deleteReport(req.params.reportId), res);
    }
);

// AUTH
app.post('/api/auth/signup', (req: Request, res: ServerResponse) => {
    handleResponse(signUp(req.body), res);
});

app.post('/api/auth/login', (req: Request, res: ServerResponse) => {
    handleResponse(login(req.body), res);
});

app.listen(port, () => {
    console.log(`Server running at http://${host}:${port}/`);
});

async function authenticate(req: Request, res: ServerResponse, next: NextFunction) {
    const token = req.headers['x-access-token'] as string;
    let tokenResponse: IVerifiedTokenResponse;
    try {
        tokenResponse = await verifyToken(token);
    } catch (err) {
        tokenResponse = err;
    }
    if (tokenResponse.status === 200) {
        req.body.userId = tokenResponse.decodedToken?.userId;
        next();
    } else {
        sendErrorResponse(res, tokenResponse.status, tokenResponse.message);
    }
}

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

function sendErrorResponse(res: ServerResponse, status: number, message: string | null) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(message));
    res.end();
}