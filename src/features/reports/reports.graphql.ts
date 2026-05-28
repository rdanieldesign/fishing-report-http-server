import { builder } from "../../graphql/builder";
import { getSignedImageUrl } from "../../services/image-service";
import {
  getFirstImageKeysByReportIds,
  getImagesByReportId,
  getReportByIdGQL,
  getReportsGQL,
  getTopLocationByCurrentMonth,
  type TopLocationByMonth,
} from "./reports.repository";

export const UserType = builder.drizzleObject("users", {
  name: "User",
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
  }),
});

export const LocationType = builder.drizzleObject("locations", {
  name: "Location",
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    googleMapsLink: t.exposeString("googleMapsLink"),
    usgsLocationId: t.exposeString("usgsLocationId", { nullable: true }),
  }),
});

export const UsgsReadingType = builder.drizzleObject("usgsReadings", {
  name: "UsgsReading",
  fields: (t) => ({
    id: t.exposeString("id"),
    parameterCode: t.exposeString("parameterCode"),
    computationIdentifier: t.exposeString("computationIdentifier"),
    parameterName: t.exposeString("parameterName"),
    value: t.exposeString("value"),
    unit: t.exposeString("unit"),
  }),
});

const ReportImageType = builder.objectRef<{
  id: number;
  imageKey: string | null;
  imageURL: string | null;
  status: string;
}>("ReportImage");
ReportImageType.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    imageKey: t.exposeString("imageKey", { nullable: true }),
    imageURL: t.exposeString("imageURL", { nullable: true }),
    status: t.exposeString("status"),
  }),
});

export const ReportType = builder.drizzleObject("reports", {
  name: "Report",
  fields: (t) => ({
    id: t.exposeInt("id"),
    date: t.exposeString("date"),
    catchCount: t.exposeInt("catchCount"),
    notes: t.exposeString("notes"),
    author: t.relation("author"),
    location: t.relation("location"),
    // TODO: replace with a DataLoader to batch getFirstImageKeysByReportIds across all reports in a request (avoids N+1)
    thumbnailUrl: t.field({
      type: "String",
      nullable: true,
      select: { columns: { id: true } },
      resolve: async (report) => {
        const keyMap = await getFirstImageKeysByReportIds([report.id]);
        const key = keyMap.get(report.id);
        return key ? getSignedImageUrl(key) : null;
      },
    }),
  }),
});

export const ReportDetailType = builder.drizzleObject("reports", {
  variant: "ReportDetail",
  fields: (t) => ({
    id: t.exposeInt("id"),
    date: t.exposeString("date"),
    catchCount: t.exposeInt("catchCount"),
    notes: t.exposeString("notes"),
    author: t.relation("author"),
    location: t.relation("location"),
    usgsReadings: t.relation("usgsReadings"),
    images: t.field({
      type: [ReportImageType],
      nullable: true,
      select: { columns: { id: true } },
      resolve: async (report) => {
        const images = await getImagesByReportId(report.id);
        if (!images.length) return null;
        return Promise.all(
          images.map(async ({ imageKey, status, id }) => ({
            imageKey,
            id,
            imageURL: imageKey ? await getSignedImageUrl(imageKey) : null,
            status,
          })),
        );
      },
    }),
  }),
});

builder.queryField("allReports", (t) =>
  t.drizzleField({
    type: [ReportType],
    nullable: true,
    args: {
      locationId: t.arg.int({ required: false }),
      authorId: t.arg.int({ required: false }),
    },
    resolve: async (query, root, args, ctx) => {
      return getReportsGQL(query, args, parseInt(ctx.currentUserId as string));
    },
  }),
);

const TopLocationByMonthType =
  builder.objectRef<TopLocationByMonth>("TopLocationByMonth");
TopLocationByMonthType.implement({
  fields: (t) => ({
    locationId: t.exposeInt("locationId"),
    locationName: t.exposeString("locationName"),
    locationGoogleMapsLink: t.exposeString("locationGoogleMapsLink"),
    totalCatchCount: t.exposeInt("totalCatchCount"),
    month: t.exposeInt("month"),
  }),
});

builder.queryField("topLocationByCurrentMonth", (t) =>
  t.field({
    type: TopLocationByMonthType,
    nullable: true,
    resolve: async (_root, _args, ctx) => {
      return (
        (await getTopLocationByCurrentMonth(
          parseInt(ctx.currentUserId as string),
        )) ?? null
      );
    },
  }),
);

builder.queryField("report", (t) =>
  t.drizzleField({
    type: ReportDetailType,
    nullable: true,
    args: {
      id: t.arg.int({ required: true }),
    },
    resolve: async (query, root, args, ctx) => {
      const userId = parseInt(ctx.currentUserId as string);
      return (await getReportByIdGQL(query, args.id, userId)) ?? null;
    },
  }),
);
