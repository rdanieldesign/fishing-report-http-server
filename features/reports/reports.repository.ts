import { and, desc, eq, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../../db";
import {
  friends,
  locations,
  reports,
  users,
  usgsReadings,
} from "../../db/schema";
import { FriendStatus } from "../../enums/friend-enum";
import type { UsgsReading } from "../usgs/usgs.service";

export type Report = InferSelectModel<typeof reports>;

export type ReportDetail = {
  id: number;
  locationId: number;
  locationName: string;
  catchCount: number;
  date: string;
  notes: string;
  authorId: number;
  authorName: string;
  imageIds: string | null;
  usgsReadings?: UsgsReading[];
};

export type NewReport = {
  locationId: number;
  catchCount: number;
  date: string;
  notes: string;
  authorId: number;
  imageIds: string | null;
};

// The visibility filter: current user can see their own reports and confirmed friends' reports.
function visibilityCondition(currentUserId: number) {
  return or(
    eq(reports.authorId, currentUserId),
    and(
      eq(friends.status, FriendStatus.Confirmed),
      or(
        eq(reports.authorId, friends.userOneId),
        eq(reports.authorId, friends.userTwoId),
      ),
    ),
  );
}

function friendsJoin(currentUserId: number) {
  return or(
    eq(friends.userOneId, currentUserId),
    eq(friends.userTwoId, currentUserId),
  );
}

export function getReports(
  params: { authorId?: number; locationId?: number },
  currentUserId: number,
): Promise<Report[]> {
  const conditions = [
    params.authorId !== undefined
      ? eq(reports.authorId, params.authorId)
      : undefined,
    params.locationId !== undefined
      ? eq(reports.locationId, params.locationId)
      : undefined,
    visibilityCondition(currentUserId),
  ].filter(Boolean) as ReturnType<typeof eq>[];

  return db
    .selectDistinct({
      id: reports.id,
      locationId: reports.locationId,
      date: reports.date,
      catchCount: reports.catchCount,
      notes: reports.notes,
      authorId: reports.authorId,
      imageIds: reports.imageIds,
    })
    .from(reports)
    .leftJoin(friends, friendsJoin(currentUserId))
    .where(and(...conditions))
    .orderBy(desc(reports.date));
}

async function getUsgsReadingsForReport(
  reportId: number,
): Promise<UsgsReading[]> {
  const rows = await db
    .select({
      id: usgsReadings.id,
      parameterCode: usgsReadings.parameterCode,
      computationIdentifier: usgsReadings.computationIdentifier,
      parameterName: usgsReadings.parameterName,
      value: usgsReadings.value,
      unit: usgsReadings.unit,
    })
    .from(usgsReadings)
    .where(eq(usgsReadings.postId, reportId));

  return rows as UsgsReading[];
}

export async function getReportDetails(
  params: { authorId?: number; locationId?: number },
  currentUserId: number,
): Promise<ReportDetail[]> {
  const conditions = [
    params.authorId !== undefined
      ? eq(reports.authorId, params.authorId)
      : undefined,
    params.locationId !== undefined
      ? eq(reports.locationId, params.locationId)
      : undefined,
    visibilityCondition(currentUserId),
  ].filter(Boolean) as ReturnType<typeof eq>[];

  const rows = await db
    .selectDistinct({
      id: reports.id,
      locationId: reports.locationId,
      locationName: locations.name,
      catchCount: reports.catchCount,
      date: reports.date,
      notes: reports.notes,
      authorId: reports.authorId,
      authorName: users.name,
      imageIds: reports.imageIds,
    })
    .from(reports)
    .innerJoin(locations, eq(reports.locationId, locations.id))
    .innerJoin(users, eq(reports.authorId, users.id))
    .leftJoin(friends, friendsJoin(currentUserId))
    .where(and(...conditions))
    .orderBy(desc(reports.date));

  return rows;
}

export async function getReportById(
  reportId: number,
  currentUserId: number,
): Promise<ReportDetail | undefined> {
  const reportQuery = db
    .selectDistinct({
      id: reports.id,
      locationId: reports.locationId,
      locationName: locations.name,
      catchCount: reports.catchCount,
      date: reports.date,
      notes: reports.notes,
      authorId: reports.authorId,
      authorName: users.name,
      imageIds: reports.imageIds,
    })
    .from(reports)
    .innerJoin(locations, eq(reports.locationId, locations.id))
    .innerJoin(users, eq(reports.authorId, users.id))
    .leftJoin(friends, friendsJoin(currentUserId))
    .where(and(eq(reports.id, reportId), visibilityCondition(currentUserId)))
    .limit(1);

  const [rows, usgsReadings] = await Promise.all([
    reportQuery,
    getUsgsReadingsForReport(reportId),
  ]);

  const row = rows[0];
  if (!row) return undefined;

  return { ...row, usgsReadings };
}

export function getReportByIdForOwnership(
  reportId: number,
): Promise<Report | undefined> {
  return db
    .select()
    .from(reports)
    .where(eq(reports.id, reportId))
    .limit(1)
    .then((rows) => rows[0]);
}

export function addReport(newReport: NewReport): Promise<number> {
  return db
    .insert(reports)
    .values(newReport)
    .then((result) => result[0].insertId);
}

export function updateReport(
  reportId: number,
  update: Partial<NewReport>,
): Promise<void> {
  return db
    .update(reports)
    .set(update)
    .where(eq(reports.id, reportId))
    .then(() => undefined);
}

export function deleteReport(reportId: number): Promise<void> {
  return db
    .delete(reports)
    .where(eq(reports.id, reportId))
    .then(() => undefined);
}
