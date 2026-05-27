import {
  and,
  desc,
  eq,
  exists,
  inArray,
  isNotNull,
  or,
  sql,
} from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { db } from "../../db";
import {
  friends,
  locations,
  reportImages,
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
  thumbnailUrl?: string | null;
  usgsReadings?: UsgsReading[];
};

export type ReportImage = {
  id: number;
  reportId: number;
  imageKey: string;
  status: "uploading" | "complete" | "failed";
};

export type NewReport = {
  locationId: number;
  catchCount: number;
  date: string;
  notes: string;
  authorId: number;
};

export type UpdateReport = {
  locationId: number;
  catchCount: number;
  date: string;
  notes: string;
  authorId: number;
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

export async function getUsgsReadingsForReport(
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

export async function getReportsList(
  params: { authorId?: number | null; locationId?: number | null },
  currentUserId: number,
): Promise<ReportDetail[]> {
  const conditions = [
    params.authorId !== undefined && params.authorId !== null
      ? eq(reports.authorId, params.authorId)
      : undefined,
    params.locationId !== undefined && params.locationId !== null
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
    })
    .from(reports)
    .innerJoin(locations, eq(reports.locationId, locations.id))
    .innerJoin(users, eq(reports.authorId, users.id))
    .leftJoin(friends, friendsJoin(currentUserId))
    .where(and(...conditions))
    .orderBy(desc(reports.date));

  return rows;
}

type FindFirstConfig = NonNullable<
  Parameters<typeof db.query.reports.findFirst>[0]
>;
type PothosQueryFn = (opts: FindFirstConfig) => FindFirstConfig;

export function getReportByIdGQL(
  query: PothosQueryFn,
  reportId: number,
  currentUserId: number,
) {
  return db.query.reports.findFirst(
    query({
      where: {
        id: reportId,
        OR: [
          { authorId: currentUserId },
          {
            RAW: (table) =>
              exists(
                db
                  .select({ n: sql`1` })
                  .from(friends)
                  .where(
                    and(
                      eq(friends.status, FriendStatus.Confirmed),
                      or(
                        and(
                          eq(friends.userOneId, currentUserId),
                          eq(friends.userTwoId, table.authorId),
                        ),
                        and(
                          eq(friends.userTwoId, currentUserId),
                          eq(friends.userOneId, table.authorId),
                        ),
                      ),
                    ),
                  ),
              ),
          },
        ],
      },
    }),
  );
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
  update: UpdateReport,
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

export function getImagesByReportId(reportId: number): Promise<ReportImage[]> {
  return db
    .select({
      id: reportImages.id,
      reportId: reportImages.reportId,
      imageKey: reportImages.imageKey,
      status: reportImages.status,
    })
    .from(reportImages)
    .where(and(eq(reportImages.reportId, reportId))) as Promise<ReportImage[]>;
}

export async function getFirstImageKeysByReportIds(
  reportIds: number[],
): Promise<Map<number, string>> {
  if (!reportIds.length) return new Map();
  const rows = await db
    .select({
      reportId: reportImages.reportId,
      imageKey: sql<string>`MIN(${reportImages.imageKey})`,
    })
    .from(reportImages)
    .where(
      and(
        inArray(reportImages.reportId, reportIds),
        eq(reportImages.status, "complete"),
        isNotNull(reportImages.imageKey),
      ),
    )
    .groupBy(reportImages.reportId);
  return new Map(rows.map((r) => [r.reportId, r.imageKey]));
}

export async function getAllImageKeysByReportId(
  reportId: number,
): Promise<string[]> {
  const rows = await db
    .select({ imageKey: reportImages.imageKey })
    .from(reportImages)
    .where(
      and(
        eq(reportImages.reportId, reportId),
        isNotNull(reportImages.imageKey),
      ),
    );
  return rows.map((r) => r.imageKey as string);
}

export async function createPendingReportImages(
  reportId: number,
  count: number,
): Promise<number[]> {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    const result = await db
      .insert(reportImages)
      .values({ reportId, status: "uploading" });
    ids.push(result[0].insertId);
  }
  return ids;
}

export function updateReportImage(id: number, imageKey: string): Promise<void> {
  return db
    .update(reportImages)
    .set({ imageKey, status: "complete" })
    .where(eq(reportImages.id, id))
    .then(() => undefined);
}

export function deleteReportImagesByKeys(
  reportId: number,
  imageKeys: string[],
): Promise<void> {
  if (!imageKeys.length) return Promise.resolve();
  return db
    .delete(reportImages)
    .where(
      and(
        eq(reportImages.reportId, reportId),
        inArray(reportImages.imageKey, imageKeys),
      ),
    )
    .then(() => undefined);
}
