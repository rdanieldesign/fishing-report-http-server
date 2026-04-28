import { and, desc, eq, or } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../../db";
import { friends, locations, reports, users } from "../../db/schema";
import { FriendStatus } from "../../enums/friend-enum";

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

export function getReportDetails(
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

  return db
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
}

export function getReportById(
  reportId: number,
  currentUserId: number,
): Promise<ReportDetail | undefined> {
  return db
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
    .limit(1)
    .then((rows) => rows[0]);
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
