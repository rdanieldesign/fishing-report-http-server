import type { IError } from "../../shared/errors";
import type {
  ImageMetadata,
  ISignedImageURL,
} from "../../services/image-service";
import {
  deleteMultipleImages,
  getSignedPutURLs,
} from "../../services/image-service";
import {
  addReport as addReportRepo,
  createPendingReportImages,
  deleteReport as deleteReportRepo,
  deleteReportImagesByKeys,
  getAllImageKeysByReportId,
  getImagesByReportId,
  getReportByIdForOwnership,
  getReportsList,
  type NewReport,
  updateReport as updateReportRepo,
  type Report,
  type ReportDetail,
} from "./reports.repository";
import { usgsQueue } from "../../queue/usgs.queue";
import { getLocation } from "../locations/locations.repository";

export type ReportWithImages = ReportDetail & {
  images?: { imageKey: string; imageURL: string }[];
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

export async function getReports(
  params: { authorId?: number | null; locationId?: number | null } = {},
  currentUserId: number | undefined,
): Promise<ReportDetail[]> {
  if (!currentUserId) return sendUnauthorizedMessage();
  return getReportsList(params, currentUserId);
}

async function createPendingImageUploads(
  reportId: number,
  metadata: ImageMetadata[],
): Promise<ISignedImageURL[]> {
  const reportImageIds = await createPendingReportImages(
    reportId,
    metadata.length,
  );
  return getSignedPutURLs(metadata, reportImageIds);
}

export async function addReport(
  newReport: NewReport & {
    imageMetadata?: ImageMetadata[];
  },
): Promise<{
  reportId: number;
  signedImageUrls: ISignedImageURL[] | null;
}> {
  const { imageMetadata, ...reportData } = newReport;
  const [reportId, location] = await Promise.all([
    addReportRepo(reportData),
    getLocation(reportData.locationId),
  ]);

  if (location?.usgsLocationId) {
    usgsQueue.add("fetch-usgs", {
      postId: reportId,
      usgsLocationId: location.usgsLocationId,
      reportDate: newReport.date,
    });
  }

  const signedImageUrls = imageMetadata?.length
    ? await createPendingImageUploads(reportId, imageMetadata)
    : null;

  return { reportId, signedImageUrls };
}

export async function updateReport(
  reportId: string,
  body: {
    locationId: number;
    catchCount: number;
    date: string;
    notes: string;
    newImageMetadata?: ImageMetadata[];
    imageKeysToKeep?: string[];
  },
  userId: number | undefined,
): Promise<{ signedImageUrls: ISignedImageURL[] | null }> {
  if (!userId) return sendUnauthorizedMessage();

  const reportIdNum = parseInt(reportId);
  const existing = await getReportByIdForOwnership(reportIdNum);
  if (!existing || !reportBelongsToUser(existing, userId)) {
    return sendUnauthorizedMessage();
  }

  const imageKeysToKeep = body.imageKeysToKeep ?? [];
  const currentImages = await getImagesByReportId(reportIdNum);
  const removedKeys = currentImages
    .map((img) => img.imageKey)
    .filter((key) => !imageKeysToKeep.includes(key));

  const newUploads = body.newImageMetadata?.length
    ? createPendingImageUploads(reportIdNum, body.newImageMetadata)
    : Promise.resolve(null);

  const deleteFromS3 = removedKeys.length
    ? deleteMultipleImages(removedKeys)
    : Promise.resolve();

  const deleteFromDb = removedKeys.length
    ? deleteReportImagesByKeys(reportIdNum, removedKeys)
    : Promise.resolve();

  const updateReport = updateReportRepo(reportIdNum, {
    locationId: body.locationId,
    date: body.date,
    catchCount: body.catchCount,
    notes: body.notes,
    authorId: userId,
  });

  const [signedImageUrls] = await Promise.all([
    newUploads,
    deleteFromS3,
    deleteFromDb,
    updateReport,
  ]);

  return { signedImageUrls };
}

export async function enqueueUsgsForReport(
  reportId: string,
  usgsLocationId: string,
  reportDate: string,
  userId: number | undefined,
): Promise<void> {
  if (!userId) return sendUnauthorizedMessage();

  const reportIdNum = parseInt(reportId);
  const existing = await getReportByIdForOwnership(reportIdNum);
  if (!existing || !reportBelongsToUser(existing, userId)) {
    return sendUnauthorizedMessage();
  }

  usgsQueue.add("fetch-usgs", {
    postId: reportIdNum,
    usgsLocationId,
    reportDate,
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

  const imageKeys = await getAllImageKeysByReportId(reportIdNum);

  await Promise.all([
    deleteReportRepo(reportIdNum),
    imageKeys.length ? deleteMultipleImages(imageKeys) : Promise.resolve(),
  ]);
}
