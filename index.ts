import {
  addLocation,
  deleteLocation,
  getLocation,
  getLocations,
  updateLocation,
} from "./services/location-service";
import express, { Response } from "express";
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

app.use(express.json());

// LOCATIONS

app.get("/api/locations", (req: Request, res: Response) => {
  handleResponse(getLocations(), res);
});

app.get("/api/locations/:locationId", (req: Request, res: Response) => {
  handleResponse(getLocation(req.params.locationId), res);
});

app.post("/api/locations", (req: Request, res: Response) => {
  handleResponse(addLocation(req.body), res);
});

app.delete(
  "/api/locations/:locationId",
  (req: Request, res: Response) => {
    handleResponse(deleteLocation(req.params.locationId), res);
  }
);

app.put("/api/locations/:locationId", (req: Request, res: Response) => {
  handleResponse(updateLocation(req.params.locationId, req.body), res);
});

// REPORTS

app.get("/api/reports", [authenticate], (req: Request, res: Response) => {
  handleResponse(getReports(req.query, req.authenticatedUserId), res);
});

app.get(
  "/api/reports/my-reports",
  [authenticate],
  (req: Request, res: Response) => {
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
  (req: Request, res: Response) => {
    handleResponse(
      getReport(req.params.reportId, req.authenticatedUserId),
      res
    );
  }
);

app.post(
  "/api/reports",
  [authenticate, uploadMutlipleImages("images")],
  (req: Request, res: Response) => {
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
  (req: Request, res: Response) => {
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
  (req: Request, res: Response) => {
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
  (req: Request, res: Response) => {
    handleResponse(getUser(req.authenticatedUserId), res);
  }
);

app.get("/api/users", (req: Request, res: Response) => {
  handleResponse(getUsers(), res);
});

app.get("/api/users/:userId", (req: Request, res: Response) => {
  handleResponse(getUser(parseInt(req.params.userId)), res);
});

// FRIENDS

app.post(
  "/api/friends",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      createFriendRequest(req.authenticatedUserId, req.body.userId),
      res
    );
  }
);

app.put("/api/friends", [authenticate], (req: Request, res: Response) => {
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
  (req: Request, res: Response) => {
    handleResponse(getFriendRequests(req.authenticatedUserId), res);
  }
);

app.get(
  "/api/friends/pending",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(getPendingFriendRequests(req.authenticatedUserId), res);
  }
);

app.get(
  "/api/friends/options",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(getFriendOptions(req.authenticatedUserId), res);
  }
);

app.get("/api/friends", [authenticate], (req: Request, res: Response) => {
  handleResponse(getFriends(req.authenticatedUserId), res);
});

// AUTH
app.post("/api/auth/signup", (req: Request, res: Response) => {
  handleResponse(signUp(req.body), res);
});

app.post("/api/auth/login", (req: Request, res: Response) => {
  handleResponse(login(req.body), res);
});

app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}/`);
});

async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = req.headers["x-access-token"] as string;
  let tokenResponse: IVerifiedTokenResponse;
  try {
    tokenResponse = await verifyToken(token);
  } catch (err) {
    tokenResponse = err as IVerifiedTokenResponse;
  }
  if (tokenResponse.status === 200) {
    req.authenticatedUserId = tokenResponse.decodedToken?.userId;
    next();
  } else {
    console.log("failure");
    sendErrorResponse(res, tokenResponse.status, tokenResponse.message);
  }
}

function handleResponse<T>(responsePromise: Promise<T>, res: Response) {
  responsePromise
    .then((response: T) => {
      res.status(200).json(response);
    })
    .catch((err: IError) => {
      const status: number | null = err && err.status ? err.status : null;
      const message: string | IError =
        err && err.message ? err.message : JSON.stringify(err);
      sendErrorResponse(res, status, message);
    });
}

function sendErrorResponse(
  res: Response,
  status: number | null,
  message: string | null
) {
  res.status(status || 500).json(message);
}
