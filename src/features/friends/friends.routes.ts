import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate } from "../../middleware/auth";
import { handleResponse } from "../../shared/handle-response";
import {
  createFriendRequest,
  getFriendOptions,
  getFriendRequests,
  getFriends,
  getPendingFriendRequests,
  updateFriendStatus,
} from "./friends.service";

export const friendsRouter = Router();

friendsRouter.post("/", [authenticate], (req: Request, res: Response) => {
  handleResponse(
    createFriendRequest(req.authenticatedUserId, req.body.userId),
    res,
  );
});

friendsRouter.put("/", [authenticate], (req: Request, res: Response) => {
  handleResponse(
    updateFriendStatus(
      req.authenticatedUserId,
      req.body.userId,
      req.body.status,
    ),
    res,
  );
});

friendsRouter.get(
  "/requests",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(getFriendRequests(req.authenticatedUserId), res);
  },
);

friendsRouter.get("/pending", [authenticate], (req: Request, res: Response) => {
  handleResponse(getPendingFriendRequests(req.authenticatedUserId), res);
});

friendsRouter.get("/options", [authenticate], (req: Request, res: Response) => {
  handleResponse(getFriendOptions(req.authenticatedUserId), res);
});

friendsRouter.get("/", [authenticate], (req: Request, res: Response) => {
  handleResponse(getFriends(req.authenticatedUserId), res);
});
