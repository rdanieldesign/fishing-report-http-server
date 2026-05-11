import type { Response } from "express";
import type { IError } from "./errors";

export function handleResponse<T>(
  responsePromise: Promise<T>,
  res: Response,
): void {
  responsePromise
    .then((response: T) => {
      res.status(200).json(response);
    })
    .catch((err: IError) => {
      const status = err?.status ?? null;
      const message = err?.message ?? JSON.stringify(err);
      res.status(status || 500).json(message);
    });
}
