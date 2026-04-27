import express, { Response } from "express";
import cors from "cors";
import { NextFunction, Request } from "express-serve-static-core";
import { authenticate } from "./middleware/auth";
import { IError } from "./interfaces/error-interface";
import {
  addLocation,
  deleteLocation,
  getLocation,
  getLocations,
  updateLocation,
} from "./services/location-service";
import {
  addReport,
  deleteReport,
  getReports,
  updateReport,
  getReport,
} from "./services/report-service";
import { login, signUp } from "./services/auth-service";
import { getUser, getUsers } from "./services/user-service";
import {
  createFriendRequest,
  getFriendRequests,
  getFriends,
  updateFriendStatus,
  getFriendOptions,
  getPendingFriendRequests,
} from "./services/friend-service";
import { uploadMultipleImages } from "./services/image-service";

export const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fishing-report.site",
      "https://www.fishing-report.site",
      "https://your-app.vercel.app",
    ],
    credentials: true,
  }),
);

app.use(express.json());

const router = express.Router();

// LOCATIONS

router.get("/locations", (_req: Request, res: Response) => {
  handleResponse(getLocations(), res);
});

router.get("/locations/:locationId", (req: Request, res: Response) => {
  handleResponse(getLocation(req.params.locationId), res);
});

router.post("/locations", (req: Request, res: Response) => {
  handleResponse(addLocation(req.body), res);
});

router.delete("/locations/:locationId", (req: Request, res: Response) => {
  handleResponse(deleteLocation(req.params.locationId), res);
});

router.put("/locations/:locationId", (req: Request, res: Response) => {
  handleResponse(updateLocation(req.params.locationId, req.body), res);
});

// REPORTS

router.get("/reports", [authenticate], (req: Request, res: Response) => {
  handleResponse(getReports(req.query, req.authenticatedUserId), res);
});

router.get(
  "/reports/my-reports",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      getReports(
        {
          ...req.query,
          authorId: req.authenticatedUserId?.toString(),
        },
        req.authenticatedUserId,
      ),
      res,
    );
  },
);

router.get(
  "/reports/:reportId",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      getReport(req.params.reportId, req.authenticatedUserId),
      res,
    );
  },
);

router.post(
  "/reports",
  [authenticate, ...uploadMultipleImages("images")],
  (req: Request, res: Response) => {
    handleResponse(
      addReport(
        {
          ...req.body,
          authorId: req.authenticatedUserId,
        },
        req.uploadedImages,
      ),
      res,
    );
  },
);

router.put(
  "/reports/:reportId",
  [authenticate, ...uploadMultipleImages("images")],
  (req: Request, res: Response) => {
    handleResponse(
      updateReport(
        req.params.reportId,
        req.body,
        req.authenticatedUserId,
        req.uploadedImages,
      ),
      res,
    );
  },
);

router.delete(
  "/reports/:reportId",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      deleteReport(req.params.reportId, req.authenticatedUserId),
      res,
    );
  },
);

// USERS

router.get("/users/current", [authenticate], (req: Request, res: Response) => {
  handleResponse(getUser(req.authenticatedUserId), res);
});

router.get("/users", (_req: Request, res: Response) => {
  handleResponse(getUsers(), res);
});

router.get("/users/:userId", (req: Request, res: Response) => {
  handleResponse(getUser(parseInt(req.params.userId)), res);
});

// FRIENDS

router.post("/friends", [authenticate], (req: Request, res: Response) => {
  handleResponse(
    createFriendRequest(req.authenticatedUserId, req.body.userId),
    res,
  );
});

router.put("/friends", [authenticate], (req: Request, res: Response) => {
  handleResponse(
    updateFriendStatus(
      req.authenticatedUserId,
      req.body.userId,
      req.body.status,
    ),
    res,
  );
});

router.get(
  "/friends/requests",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(getFriendRequests(req.authenticatedUserId), res);
  },
);

router.get(
  "/friends/pending",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(getPendingFriendRequests(req.authenticatedUserId), res);
  },
);

router.get(
  "/friends/options",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(getFriendOptions(req.authenticatedUserId), res);
  },
);

router.get("/friends", [authenticate], (req: Request, res: Response) => {
  handleResponse(getFriends(req.authenticatedUserId), res);
});

// AUTH

router.post("/auth/signup", (req: Request, res: Response) => {
  handleResponse(signUp(req.body), res);
});

router.post("/auth/login", (req: Request, res: Response) => {
  handleResponse(login(req.body), res);
});

app.use("/api", router);

function handleResponse<T>(responsePromise: Promise<T>, res: Response) {
  responsePromise
    .then((response: T) => {
      res.status(200).json(response);
    })
    .catch((err: IError) => {
      const status: number | null = err && err.status ? err.status : null;
      const message: string | IError =
        err && err.message ? err.message : JSON.stringify(err);
      res.status(status || 500).json(message);
    });
}
