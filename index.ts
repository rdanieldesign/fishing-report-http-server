import { ServerResponse } from "http";
import {
  addLocation,
  deleteLocation,
  getLocation,
  getLocations,
  updateLocation,
} from "./services/location-service";
import express from "express";
import { json } from "body-parser";
import {
  addReport,
  deleteReport,
  getReports,
  updateReport,
  getReport,
} from "./services/report-service";
import { login, signUp, verifyToken } from "./services/auth-service";
import { IVerifiedTokenResponse } from "./interfaces/auth-interface";
import { NextFunction, Request } from "express-serve-static-core";
import { IError } from "./interfaces/error-interface";
import { getUser, getUsers } from "./services/user-service";
import {
  createFriendRequest,
  getFriendRequests,
  getFriends,
  updateFriendStatus,
  getFriendOptions,
  getPendingFriendRequests,
} from "./services/friend-service";
import { uploadMutlipleImages } from "./services/image-service";

// Logging

var fs = require("fs");
var util = require("util");
var logFile = fs.createWriteStream("log.txt", { flags: "a" });
// Or 'w' to truncate the file every time the process starts.
var logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + "\n");
  logStdout.write(util.format.apply(null, arguments) + "\n");
};
console.error = console.log;

// end Logging

const host = "localhost";
const port = 3000;
const app = express();

app.use(json());

// LOCATIONS

app.get("/api/locations", (req: Request, res: ServerResponse) => {
  handleResponse(getLocations(), res);
});

app.get("/api/locations/:locationId", (req: Request, res: ServerResponse) => {
  handleResponse(getLocation(req.params.locationId), res);
});

app.post("/api/locations", (req: Request, res: ServerResponse) => {
  handleResponse(addLocation(req.body), res);
});

app.delete(
  "/api/locations/:locationId",
  (req: Request, res: ServerResponse) => {
    handleResponse(deleteLocation(req.params.locationId), res);
  }
);

app.put("/api/locations/:locationId", (req: Request, res: ServerResponse) => {
  handleResponse(updateLocation(req.params.locationId, req.body), res);
});

// REPORTS

app.get("/api/reports", [authenticate], (req: Request, res: ServerResponse) => {
  handleResponse(getReports(req.query, req.authenticatedUserId), res);
});

app.get(
  "/api/reports/my-reports",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(
      getReports(
        {
          ...req.query,
          authorId: req.authenticatedUserId?.toString(),
        },
        req.authenticatedUserId
      ),
      res
    );
  }
);

app.get(
  "/api/reports/:reportId",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(
      getReport(req.params.reportId, req.authenticatedUserId),
      res
    );
  }
);

app.post(
  "/api/reports",
  [authenticate, uploadMutlipleImages("images")],
  (req: Request, res: ServerResponse) => {
    handleResponse(
      addReport(
        {
          ...req.body,
          authorId: req.authenticatedUserId,
        },
        req.files as Express.MulterS3.File[]
      ),
      res
    );
  }
);

app.put(
  "/api/reports/:reportId",
  [authenticate, uploadMutlipleImages("images")],
  (req: Request, res: ServerResponse) => {
    handleResponse(
      updateReport(
        req.params.reportId,
        req.body,
        req.authenticatedUserId,
        req.files as Express.MulterS3.File[]
      ),
      res
    );
  }
);

app.delete(
  "/api/reports/:reportId",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(
      deleteReport(req.params.reportId, req.authenticatedUserId),
      res
    );
  }
);

// USERS
app.get(
  "/api/users/current",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(getUser(req.authenticatedUserId), res);
  }
);

app.get("/api/users", (req: Request, res: ServerResponse) => {
  handleResponse(getUsers(), res);
});

app.get("/api/users/:userId", (req: Request, res: ServerResponse) => {
  handleResponse(getUser(parseInt(req.params.userId)), res);
});

// FRIENDS

app.post(
  "/api/friends",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(
      createFriendRequest(req.authenticatedUserId, req.body.userId),
      res
    );
  }
);

app.put("/api/friends", [authenticate], (req: Request, res: ServerResponse) => {
  handleResponse(
    updateFriendStatus(
      req.authenticatedUserId,
      req.body.userId,
      req.body.status
    ),
    res
  );
});

app.get(
  "/api/friends/requests",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(getFriendRequests(req.authenticatedUserId), res);
  }
);

app.get(
  "/api/friends/pending",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(getPendingFriendRequests(req.authenticatedUserId), res);
  }
);

app.get(
  "/api/friends/options",
  [authenticate],
  (req: Request, res: ServerResponse) => {
    handleResponse(getFriendOptions(req.authenticatedUserId), res);
  }
);

app.get("/api/friends", [authenticate], (req: Request, res: ServerResponse) => {
  handleResponse(getFriends(req.authenticatedUserId), res);
});

// AUTH
app.post("/api/auth/signup", (req: Request, res: ServerResponse) => {
  handleResponse(signUp(req.body), res);
});

app.post("/api/auth/login", (req: Request, res: ServerResponse) => {
  handleResponse(login(req.body), res);
});

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}/`);
});

async function authenticate(
  req: Request,
  res: ServerResponse,
  next: NextFunction
) {
  const token = req.headers["x-access-token"] as string;
  let tokenResponse: IVerifiedTokenResponse;
  try {
    tokenResponse = await verifyToken(token);
  } catch (err) {
    tokenResponse = err;
  }
  if (tokenResponse.status === 200) {
    req.authenticatedUserId = tokenResponse.decodedToken?.userId;
    next();
  } else {
    console.log("failure");
    sendErrorResponse(res, tokenResponse.status, tokenResponse.message);
  }
}

function handleResponse<T>(responsePromise: Promise<T>, res: ServerResponse) {
  responsePromise
    .then((response: T) => {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.write(JSON.stringify(response));
    })
    .catch((err: IError) => {
      const status: number | null = err && err.status ? err.status : null;
      const message: string | IError =
        err && err.message ? err.message : JSON.stringify(err);
      sendErrorResponse(res, status, message);
    })
    .finally(() => {
      res.end();
    });
}

function sendErrorResponse(
  res: ServerResponse,
  status: number | null,
  message: string | null
) {
  res.writeHead(status || 500, { "Content-Type": "application/json" });
  res.write(JSON.stringify(message));
}
