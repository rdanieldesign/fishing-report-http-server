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
    (res: IReportModel[]): IReport | null => {
      if (!res?.[0]) {
        return null;
      }
      if (!res[0].imageIds) {
        return res[0];
      }
      const { imageIds, ...report } = res[0];
      return {
        ...report,
        images: JSON.parse(imageIds).map((imageId: string) => {
          return {
            imageId,
            imageURL: getSignedImageUrl(imageId),
          };
        }),
      };
    }
  );
}

export function addReport(
  newReport: INewReport,
  images: Express.MulterS3.File[]
): Promise<number> {
  // Use the first transform. This might be revised later for thumbnails
  const imageIds = JSON.stringify(images.map((img) => img.transforms[0].key));
  return addReportModel({ ...newReport, imageIds }).then((res: OkPacket) => {
    return res.insertId;
  });
}

export async function updateReport(
  reportId: string,
  newReport: INewReportModel,
  userId: number | undefined,
  images: Express.MulterS3.File[]
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
        JSON.parse(newReport.imageIds)?.map((imageId: string) => {
          const matchingImage = images.find((image) => {
            return image.originalname === imageId;
          });
          if (matchingImage?.transforms?.[0]?.key) {
            return matchingImage.transforms[0].key;
          }
          return imageId;
        })
      ),
      authorId: userId,
      id: parseInt(reportId),
    };
    const removedImageIds = JSON.parse(report.imageIds)?.filter(
      (imageId: string) => {
        return !JSON.parse(updatedReport.imageIds)?.find(
          (newId: string) => newId === imageId
        );
      }
    );
    if (removedImageIds?.length) {
      deleteMultipleImages(removedImageIds);
    }
    return updateReportModel(parseInt(reportId), updatedReport);
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
  const [report] = await getReportByIdModel(parseInt(reportId), userId);
  const userCanDeleteReport = reportBelongsToUser(report, userId);
  if (userCanDeleteReport) {
    const imageIds = JSON.parse(report.imageIds);
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
