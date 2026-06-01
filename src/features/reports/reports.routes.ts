import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate, authenticateService } from "../../middleware/auth";
import { handleResponse } from "../../shared/handle-response";
import {
  addReport,
  deleteReport,
  enqueueUsgsForReport,
  enqueueWeatherForReport,
  updateReport,
} from "./reports.service";
import { updateReportImage } from "./reports.repository";

export const reportsRouter = Router();

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

reportsRouter.post(
  "/:reportId/weather",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      enqueueWeatherForReport(req.params.reportId, req.authenticatedUserId),
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
