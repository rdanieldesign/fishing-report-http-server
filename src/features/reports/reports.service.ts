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
  type NewReport,
  updateReport as updateReportRepo,
  type Report,
} from "./reports.repository";
import { usgsQueue } from "../../queue/usgs.queue";
import { weatherQueue } from "../../queue/weather.queue";
import { getLocation } from "../locations/locations.repository";

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

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

  if (location?.usgsLocationId && location.timezone) {
    usgsQueue.add("fetch-usgs", {
      locationId: reportData.locationId,
      usgsLocationId: location.usgsLocationId,
      date: newReport.date,
      timezone: location.timezone,
    });
  }

  if (location?.coordinates) {
    weatherQueue.add("fetch-weather", {
      locationId: reportData.locationId,
      coordinates: location.coordinates,
      startDate: subtractDays(newReport.date, 4),
      endDate: newReport.date,
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
  userId: number | undefined,
): Promise<void> {
  if (!userId) return sendUnauthorizedMessage();

  const reportIdNum = parseInt(reportId);
  const existing = await getReportByIdForOwnership(reportIdNum);
  if (!existing || !reportBelongsToUser(existing, userId)) {
    return sendUnauthorizedMessage();
  }

  const location = await getLocation(existing.locationId);
  if (!location?.usgsLocationId || !location.timezone) return;

  usgsQueue.add("fetch-usgs", {
    locationId: existing.locationId,
    usgsLocationId: location.usgsLocationId,
    date: existing.date,
    timezone: location.timezone,
  });
}

export async function enqueueWeatherForReport(
  reportId: string,
  userId: number | undefined,
): Promise<void> {
  if (!userId) return sendUnauthorizedMessage();

  const reportIdNum = parseInt(reportId);
  const existing = await getReportByIdForOwnership(reportIdNum);
  if (!existing || !reportBelongsToUser(existing, userId)) {
    return sendUnauthorizedMessage();
  }

  const location = await getLocation(existing.locationId);
  if (!location?.coordinates) return;

  weatherQueue.add("fetch-weather", {
    locationId: existing.locationId,
    coordinates: location.coordinates,
    startDate: subtractDays(existing.date, 4),
    endDate: existing.date,
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
