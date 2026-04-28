import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate } from "../../middleware/auth";
import { handleResponse } from "../../shared/handle-response";
import { getUser, getUsers } from "./users.service";

export const usersRouter = Router();

usersRouter.get("/current", [authenticate], (req: Request, res: Response) => {
  handleResponse(getUser(req.authenticatedUserId), res);
});

usersRouter.get("/", (_req: Request, res: Response) => {
  handleResponse(getUsers(), res);
});

usersRouter.get("/:userId", (req: Request, res: Response) => {
  handleResponse(getUser(parseInt(req.params.userId)), res);
});
