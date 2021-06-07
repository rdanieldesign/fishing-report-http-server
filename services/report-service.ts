import { ParsedQs } from "qs";
import { IError } from "../interfaces/error-interface";
import {
  INewReport,
  IReport,
  IReportDetails,
} from "../interfaces/report-interface";
import {
  addReport as addReportModel,
  updateReport as updateReportModel,
  deleteReport as deleteReportModel,
  getReports as getReportsModel,
  getReportById as getReportByIdModel,
} from "../models/report-model";

async function reportBelongsToUser(
  reportId: string,
  userId: number
): Promise<boolean> {
  const report = await getReport(reportId);
  return Boolean(report && report.authorId === userId);
}

function sendUnauthorizedMessage(): Promise<IError> {
  const error: IError = {
    status: 403,
    message: "You are not authorized to delete this record.",
  };
  return Promise.reject(error);
}

export function getReports(
  queryParams: ParsedQs
): Promise<IReport[] | IReportDetails[]> {
  const allowedParams = ["authorId", "locationId"];
  const reportParams: Partial<IReport> = allowedParams.reduce(
    (
      params: { [key: string]: number },
      key: string
    ): { [key: string]: number } => {
      if (queryParams[key]) {
        params[key] = parseInt(queryParams[key] as string);
      }
      return params;
    },
    {}
  );
  return getReportsModel(reportParams, queryParams.details === "true");
}

export function getReport(reportId: string): Promise<IReport | null> {
  return getReportByIdModel(parseInt(reportId)).then(
    (res: IReport[]): IReport | null => {
      if (res && res[0]) {
        return res[0];
      } else {
        return null;
      }
    }
  );
}

export function addReport(newReport: INewReport): Promise<IReport> {
  return addReportModel(newReport);
}

export async function updateReport(
  reportId: string,
  newReport: INewReport,
  userId: number
): Promise<IReport | IError> {
  const userCanDeleteReport = await reportBelongsToUser(reportId, userId);
  if (userCanDeleteReport) {
    return updateReportModel(parseInt(reportId), newReport);
  } else {
    return sendUnauthorizedMessage();
  }
}

export async function deleteReport(
  reportId: string,
  userId: number
): Promise<void | IError> {
  const userCanDeleteReport = await reportBelongsToUser(reportId, userId);
  if (userCanDeleteReport) {
    return deleteReportModel(parseInt(reportId));
  } else {
    return sendUnauthorizedMessage();
  }
}
