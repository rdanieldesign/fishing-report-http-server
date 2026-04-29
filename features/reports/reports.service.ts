import type { ParsedQs } from "qs";
import type { IError } from "../../shared/errors";
import type { IUploadedImage } from "../../services/image-service";
import {
  deleteMultipleImages,
  getSignedImageUrl,
} from "../../services/image-service";
import {
  addReport as addReportRepo,
  deleteReport as deleteReportRepo,
  getReportById,
  getReportByIdForOwnership,
  getReportDetails,
  updateReport as updateReportRepo,
  type Report,
  type ReportDetail,
} from "./reports.repository";

export type ReportWithImages = Omit<ReportDetail, "imageIds"> & {
  images?: { imageId: string; imageURL: string }[];
};

function sendUnauthorizedMessage(): Promise<never> {
  const error: IError = {
    status: 403,
    message: "You are not authorized to delete this record.",
  };
  return Promise.reject(error);
}

function reportBelongsToUser(report: Report, userId: number): boolean {
  return report?.authorId === userId;
}

export function getReports(
  params: { authorId?: number; locationId?: number } = {},
  currentUserId: number | undefined,
): Promise<Report[] | ReportDetail[]> {
  if (!currentUserId) return sendUnauthorizedMessage();
  return getReportDetails(params, currentUserId);
}

export async function getReport(
  reportId: string,
  currentUserId: number | undefined,
): Promise<ReportWithImages | null> {
  if (!currentUserId) return sendUnauthorizedMessage();

  const row = await getReportById(parseInt(reportId), currentUserId);
  if (!row) return null;

  if (!row.imageIds) {
    const { imageIds, ...report } = row;
    return report;
  }

  const { imageIds, ...report } = row;
  const parsedIds: string[] = Array.isArray(imageIds)
    ? imageIds
    : JSON.parse(imageIds);
  return {
    ...report,
    images: await Promise.all(
      parsedIds.map(async (imageId) => ({
        imageId,
        imageURL: await getSignedImageUrl(imageId),
      })),
    ),
  };
}

export function addReport(
  newReport: Omit<Report, "id" | "imageIds"> & { notes: string },
  images: IUploadedImage[],
): Promise<number> {
  const imageIds = JSON.stringify(images.map((img) => img.key));
  return addReportRepo({ ...newReport, imageIds });
}

export async function updateReport(
  reportId: string,
  body: {
    locationId: number;
    date: string;
    catchCount: number;
    notes: string;
    imageIds?: string | string[];
  },
  userId: number | undefined,
  images: IUploadedImage[],
): Promise<void> {
  if (!userId) return sendUnauthorizedMessage();

  const reportIdNum = parseInt(reportId);
  const existing = await getReportByIdForOwnership(reportIdNum);
  if (!existing || !reportBelongsToUser(existing, userId)) {
    return sendUnauthorizedMessage();
  }

  const incomingIds: string[] = Array.isArray(body.imageIds)
    ? body.imageIds
    : body.imageIds
      ? JSON.parse(body.imageIds)
      : [];

  const resolvedIds = incomingIds.map((imageId) => {
    const match = images.find((img) => img.originalname === imageId);
    return match?.key ?? imageId;
  });

  const existingIds: string[] = existing.imageIds
    ? Array.isArray(existing.imageIds)
      ? existing.imageIds
      : JSON.parse(existing.imageIds)
    : [];

  const removedIds = existingIds.filter((id) => !resolvedIds.includes(id));
  if (removedIds.length) await deleteMultipleImages(removedIds);

  await updateReportRepo(reportIdNum, {
    locationId: body.locationId,
    date: body.date,
    catchCount: body.catchCount,
    notes: body.notes,
    authorId: userId,
    imageIds: JSON.stringify(resolvedIds),
  });
}

export async function deleteReport(
  reportId: string,
  userId: number | undefined,
): Promise<void> {
  if (!userId) return sendUnauthorizedMessage();

  const reportIdNum = parseInt(reportId);
  const existing = await getReportByIdForOwnership(reportIdNum);
  if (!existing || !reportBelongsToUser(existing, userId)) {
    return sendUnauthorizedMessage();
  }

  const imageIds: string[] = existing.imageIds
    ? Array.isArray(existing.imageIds)
      ? existing.imageIds
      : JSON.parse(existing.imageIds)
    : [];

  await deleteReportRepo(reportIdNum);
  if (imageIds.length) await deleteMultipleImages(imageIds);
}
