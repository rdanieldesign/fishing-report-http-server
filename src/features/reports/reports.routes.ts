import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate, authenticateService } from "../../middleware/auth";
import { handleResponse } from "../../shared/handle-response";
import {
  addReport,
  deleteReport,
  enqueueUsgsForReport,
  getReports,
  updateReport,
} from "./reports.service";
import { updateReportImage } from "./reports.repository";
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

reportsRouter.post("/", [authenticate], (req: Request, res: Response) => {
  handleResponse(
    addReport({ ...req.body, authorId: req.authenticatedUserId }),
    res,
  );
});

reportsRouter.put(
  "/:reportId",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      updateReport(req.params.reportId, req.body, req.authenticatedUserId),
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

reportsRouter.patch(
  "/images/:id",
  [authenticateService],
  (req: Request, res: Response) => {
    handleResponse(
      updateReportImage(parseInt(req.params.id), req.body.imageKey),
      res,
    );
  },
);
