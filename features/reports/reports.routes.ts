import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate } from "../../middleware/auth";
import { uploadMultipleImages } from "../../services/image-service";
import { handleResponse } from "../../shared/handle-response";
import {
  addReport,
  deleteReport,
  enqueueUsgsForReport,
  getReport,
  getReports,
  updateReport,
} from "./reports.service";
import { ParsedQs } from "qs";

export const reportsRouter = Router();

function getReportParams(reqParams: ParsedQs): {
  authorId?: number;
  locationId?: number;
} {
  const params: { authorId?: number; locationId?: number } = {};
  if (reqParams.authorId)
    params.authorId = parseInt(reqParams.authorId as string);
  if (reqParams.locationId)
    params.locationId = parseInt(reqParams.locationId as string);
  return params;
}

reportsRouter.get("/", [authenticate], (req: Request, res: Response) => {
  const params: { authorId?: number; locationId?: number } = getReportParams(
    req.query,
  );
  handleResponse(getReports(params, req.authenticatedUserId), res);
});

reportsRouter.get(
  "/my-reports",
  [authenticate],
  (req: Request, res: Response) => {
    const params: { authorId?: number; locationId?: number } = {
      ...getReportParams(req.query),
      authorId: req.authenticatedUserId,
    };
    handleResponse(getReports(params, req.authenticatedUserId), res);
  },
);

reportsRouter.get(
  "/:reportId",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      getReport(req.params.reportId, req.authenticatedUserId),
      res,
    );
  },
);

reportsRouter.post(
  "/",
  [authenticate, ...uploadMultipleImages("images")],
  (req: Request, res: Response) => {
    handleResponse(
      addReport(
        { ...req.body, authorId: req.authenticatedUserId },
        req.uploadedImages,
      ),
      res,
    );
  },
);

reportsRouter.put(
  "/:reportId",
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

reportsRouter.post(
  "/:reportId/usgs",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      enqueueUsgsForReport(
        req.params.reportId,
        req.body.usgsLocationId,
        req.body.reportDate,
        req.authenticatedUserId,
      ),
      res,
    );
  },
);

reportsRouter.delete(
  "/:reportId",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      deleteReport(req.params.reportId, req.authenticatedUserId),
      res,
    );
  },
);
