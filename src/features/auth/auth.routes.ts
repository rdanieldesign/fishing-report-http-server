import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { handleResponse } from "../../shared/handle-response";
import { login, signUp } from "./auth.service";

export const authRouter = Router();

authRouter.post("/signup", (req: Request, res: Response) => {
  handleResponse(signUp(req.body), res);
});

authRouter.post("/login", (req: Request, res: Response) => {
  handleResponse(login(req.body), res);
});
