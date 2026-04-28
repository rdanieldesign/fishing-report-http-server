import { Router } from "express";
import type { Request, Response } from "express-serve-static-core";
import { authenticate } from "../../middleware/auth";
import { uploadMultipleImages } from "../../services/image-service";
import { handleResponse } from "../../shared/handle-response";
import {
  addReport,
  deleteReport,
  getReport,
  getReports,
  updateReport,
} from "./reports.service";

export const reportsRouter = Router();

reportsRouter.get("/", [authenticate], (req: Request, res: Response) => {
  handleResponse(getReports(req.query, req.authenticatedUserId), res);
});

reportsRouter.get(
  "/my-reports",
  [authenticate],
  (req: Request, res: Response) => {
    handleResponse(
      getReports(
        { ...req.query, authorId: req.authenticatedUserId?.toString() },
        req.authenticatedUserId,
      ),
      res,
    );
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
