import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { handleResponse } from "../../shared/handle-response";
import {
  addLocation,
  deleteLocation,
  getLocation,
  getLocations,
  updateLocation,
} from "./locations.service";

export const locationsRouter = Router();

locationsRouter.get("/", (_req: Request, res: Response) => {
  handleResponse(getLocations(), res);
});

locationsRouter.get("/:locationId", (req: Request, res: Response) => {
  handleResponse(getLocation(req.params.locationId), res);
});

locationsRouter.post("/", (req: Request, res: Response) => {
  handleResponse(addLocation(req.body), res);
});

locationsRouter.put("/:locationId", (req: Request, res: Response) => {
  handleResponse(updateLocation(req.params.locationId, req.body), res);
});

locationsRouter.delete("/:locationId", (req: Request, res: Response) => {
  handleResponse(deleteLocation(req.params.locationId), res);
});
