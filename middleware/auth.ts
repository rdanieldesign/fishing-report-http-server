import { NextFunction, Request, Response } from "express-serve-static-core";
import { verifyToken } from "../features/auth/auth.service";
import type { IVerifiedTokenResponse } from "../features/auth/auth.types";

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
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
    res.status(tokenResponse.status || 401).json(tokenResponse.message);
  }
}
