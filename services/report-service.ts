import { OkPacket } from "mysql";
import { ParsedQs } from "qs";
import { IError } from "../interfaces/error-interface";
import {
  INewReport,
  INewReportModel,
  IReport,
  IReportDetails,
  IReportModel,
} from "../interfaces/report-interface";
import {
  addReport as addReportModel,
  updateReport as updateReportModel,
  deleteReport as deleteReportModel,
  getReports as getReportsModel,
  getReportById as getReportByIdModel,
} from "../models/report-model";
import { deleteMultipleImages, getSignedImageUrl } from "./image-service";
import { IUploadedImage } from "../interfaces/uploaded-image";

function reportBelongsToUser(report: IReportModel, userId: number): boolean {
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
  currentUserId: number | undefined,
): Promise<IReport[] | IReportDetails[] | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  const allowedParams = ["authorId", "locationId"];
  const reportParams: Partial<IReport> = allowedParams.reduce(
    (
      params: { [key: string]: number },
      key: string,
    ): { [key: string]: number } => {
      if (queryParams[key]) {
        params[key] = parseInt(queryParams[key] as string);
      }
      return params;
    },
    {},
  );
  return getReportsModel(
    reportParams,
    queryParams.details === "true",
    currentUserId,
  );
}

export async function getReport(
  reportId: string,
  currentUserId: number | undefined,
): Promise<IReport | null | IError> {
  if (!currentUserId) {
    return sendUnauthorizedMessage();
  }
  const res = await getReportByIdModel(parseInt(reportId), currentUserId);
  if (!res?.[0]) {
    return null;
  }
  if (!res[0].imageIds) {
    return res[0];
  }
  const { imageIds, ...report } = res[0];
  const parsedImageIds = Array.isArray(imageIds)
    ? imageIds
    : JSON.parse(imageIds);
  return {
    ...report,
    images: await Promise.all(
      parsedImageIds.map(async (imageId: string) => {
        return {
          imageId,
          imageURL: await getSignedImageUrl(imageId),
        };
      }),
    ),
  };
}

export function addReport(
  newReport: INewReport,
  images: IUploadedImage[],
): Promise<number> {
  const imageIds = JSON.stringify(images.map((img) => img.key));
  return addReportModel({ ...newReport, imageIds }).then((res: OkPacket) => {
    return res.insertId;
  });
}

export async function updateReport(
  reportId: string,
  newReport: INewReportModel,
  userId: number | undefined,
  images: IUploadedImage[],
): Promise<IReport | IError> {
  if (!userId) {
    return sendUnauthorizedMessage();
  }
  const [report] = await getReportByIdModel(parseInt(reportId), userId);
  const userCanUpdateReport = reportBelongsToUser(report, userId);
  if (userCanUpdateReport) {
    const updatedReport: IReportModel = {
      ...newReport,
      imageIds: JSON.stringify(
        (Array.isArray(newReport.imageIds)
          ? newReport.imageIds
          : JSON.parse(newReport.imageIds)
        )?.map((imageId: string) => {
          const matchingImage = images.find((image) => {
            return image.originalname === imageId;
          });
          if (matchingImage?.key) {
            return matchingImage.key;
          }
          return imageId;
        }),
      ),
      authorId: userId,
      id: parseInt(reportId),
    };
    const removedImageIds = (
      Array.isArray(report.imageIds)
        ? report.imageIds
        : JSON.parse(report.imageIds)
    )?.filter((imageId: string) => {
      return !JSON.parse(updatedReport.imageIds)?.find(
        (newId: string) => newId === imageId,
      );
    });
    if (removedImageIds?.length) {
      await deleteMultipleImages(removedImageIds);
    }
    return updateReportModel(parseInt(reportId), updatedReport);
  } else {
    return sendUnauthorizedMessage();
  }
}

export async function deleteReport(
  reportId: string,
  userId: number | undefined,
): Promise<void | IError> {
  if (!userId) {
    return sendUnauthorizedMessage();
  }
  const [report] = await getReportByIdModel(parseInt(reportId), userId);
  const userCanDeleteReport = reportBelongsToUser(report, userId);
  if (userCanDeleteReport) {
    const imageIds = Array.isArray(report.imageIds)
      ? report.imageIds
      : JSON.parse(report.imageIds);
    return deleteReportModel(parseInt(reportId)).then(async (res) => {
      if (imageIds) {
        await deleteMultipleImages(imageIds);
      }
      return res;
    });
  } else {
    return sendUnauthorizedMessage();
  }
}
