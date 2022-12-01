import { OkPacket } from "mysql";
import { ParsedQs } from "qs";
import { IError } from "../interfaces/error-interface";
import {
  INewReport,
  IReport,
  IReportDetails,
} from "../interfaces/report-interface";
import {
  addReportImages,
  getReportImages,
} from "../models/report-images-model";
import {
  addReport as addReportModel,
  updateReport as updateReportModel,
  deleteReport as deleteReportModel,
  getReports as getReportsModel,
  getReportById as getReportByIdModel,
} from "../models/report-model";
import { deleteMultipleImages, getSignedImageUrl } from "./image-service";

async function reportBelongsToUser(
  reportId: string,
  userId: number
): Promise<boolean> {
  const report = await getReport(reportId, userId);
  return Boolean(report && (report as IReport).authorId === userId);
}

function sendUnauthorizedMessage(): Promise<IError> {
  const error: IError = {
    status: 403,
    message: "You are not authorized to delete this record.",
  };
  return Promise.reject(error);
}

export function getReports(
  queryParams: ParsedQs,
  currentUserId: number | undefined
): Promise<IReport[] | IReportDetails[] | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
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
  return getReportsModel(
    reportParams,
    queryParams.details === "true",
    currentUserId
  );
}

export function getReport(
  reportId: string,
  currentUserId: number | undefined
): Promise<IReport | null | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  return getReportByIdModel(parseInt(reportId), currentUserId).then(
    (res: IReport[]): Promise<IReport> => {
      if (res?.[0]) {
        return getReportImageIds(res[0].id).then((reportImageIds): IReport => {
          res[0].imageURLs = reportImageIds.map((reportImageId) =>
            getSignedImageUrl(reportImageId)
          );
          return res[0];
        });
      } else {
        return Promise.reject(null);
      }
    }
  );
}

export function addReport(
  newReport: INewReport,
  images: Express.MulterS3.File[]
): Promise<number> {
  // Use the first transform. This might be revised later for thumbnails
  const imageIds = images.map((img) => img.transforms[0].key);
  return addReportModel(newReport).then((res: OkPacket) => {
    return addReportImages(res.insertId, imageIds).then(() => res.insertId);
  });
}

export async function updateReport(
  reportId: string,
  newReport: INewReport,
  userId: number | undefined
): Promise<IReport | IError> {
  if (!userId) {
    return sendUnauthorizedMessage();
  }
  const userCanUpdateReport = await reportBelongsToUser(reportId, userId);
  if (userCanUpdateReport) {
    return updateReportModel(parseInt(reportId), newReport);
  } else {
    return sendUnauthorizedMessage();
  }
}

export async function deleteReport(
  reportId: string,
  userId: number | undefined
): Promise<void | IError> {
  if (!userId) {
    return sendUnauthorizedMessage();
  }
  const userCanDeleteReport = await reportBelongsToUser(reportId, userId);
  if (userCanDeleteReport) {
    const imageIds = await getReportImageIds(parseInt(reportId));
    return deleteReportModel(parseInt(reportId)).then((res) => {
      if (imageIds) {
        deleteMultipleImages(imageIds);
      }
      return res;
    });
  } else {
    return sendUnauthorizedMessage();
  }
}

async function getReportImageIds(reportId: number): Promise<string[]> {
  const reportImages = await getReportImages(reportId);
  return reportImages.map((reportImage) => reportImage.imageId);
}
