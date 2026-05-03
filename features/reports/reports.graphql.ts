import { builder } from "../../graphql/builder";
import { getSignedImageUrl } from "../../services/image-service";
import { getReportByIdGQL } from "./reports.repository";
import { getReports } from "./reports.service";

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
  imageId: string;
  imageURL: string;
}>("ReportImage");
ReportImageType.implement({
  fields: (t) => ({
    imageId: t.exposeString("imageId"),
    imageURL: t.exposeString("imageURL"),
  }),
});

export const ReportType = builder.drizzleObject("reports", {
  name: "Report",
  fields: (t) => ({
    id: t.exposeInt("id"),
    date: t.exposeString("date"),
    catchCount: t.exposeInt("catchCount"),
    notes: t.exposeString("notes"),
    authorId: t.exposeInt("authorId"),
    imageIds: t.expose("imageIds", { type: "JSON", nullable: true }),
  }),
});

export const ReportDetailType = builder.drizzleObject("reports", {
  variant: "ReportDetail",
  fields: (t) => ({
    id: t.exposeInt("id"),
    date: t.exposeString("date"),
    catchCount: t.exposeInt("catchCount"),
    notes: t.exposeString("notes"),
    authorId: t.exposeInt("authorId"),
    location: t.relation("location"),
    usgsReadings: t.relation("usgsReadings"),
    images: t.field({
      type: [ReportImageType],
      nullable: true,
      select: {
        columns: { imageIds: true },
      },
      resolve: async (report) => {
        if (!report.imageIds) return null;
        const ids: string[] = Array.isArray(report.imageIds)
          ? report.imageIds
          : JSON.parse(report.imageIds);
        return Promise.all(
          ids.map(async (imageId) => ({
            imageId,
            imageURL: await getSignedImageUrl(imageId),
          })),
        );
      },
    }),
  }),
});

builder.queryField("allReports", (t) =>
  t.drizzleField({
    type: [ReportType],
    resolve: async (query, root, args, ctx) => {
      // TODO: pass query to orm to only select requested fields
      return getReports({}, parseInt(ctx.currentUserId as string));
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
