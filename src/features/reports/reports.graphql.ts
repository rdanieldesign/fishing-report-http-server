import { builder } from "../../graphql/builder";
import { getSignedImageUrl } from "../../services/image-service";
import {
  getFirstImageKeysByReportIds,
  getImagesByReportId,
  getReportByIdGQL,
  getReportsGQL,
  getPaginatedReportsGQL,
  getTopLocationByCurrentMonth,
  type TopLocationByMonth,
} from "./reports.repository";
import {
  getWeatherForDateRange,
  type WeatherDaily,
} from "../weather/weather.repository";

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

const WeatherConditionsType = builder.objectRef<
  WeatherDaily & { priorRainfall: number | null }
>("WeatherConditions");
WeatherConditionsType.implement({
  fields: (t) => ({
    date: t.exposeString("date"),
    tempMax: t.exposeString("tempMax", { nullable: true }),
    tempMin: t.exposeString("tempMin", { nullable: true }),
    tempMean: t.exposeString("tempMean", { nullable: true }),
    precipitationSum: t.exposeString("precipitationSum", { nullable: true }),
    weatherCode: t.exposeInt("weatherCode", { nullable: true }),
    windSpeedMax: t.exposeString("windSpeedMax", { nullable: true }),
    cloudCoverMin: t.exposeString("cloudCoverMin", { nullable: true }),
    cloudCoverMax: t.exposeString("cloudCoverMax", { nullable: true }),
    cloudCoverMean: t.exposeString("cloudCoverMean", { nullable: true }),
    priorRainfall: t.exposeFloat("priorRainfall", { nullable: true }),
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
    weatherConditions: t.field({
      type: WeatherConditionsType,
      nullable: true,
      select: { columns: { locationId: true, date: true } },
      resolve: async (report) => {
        const d = new Date(`${report.date}T12:00:00Z`);
        d.setUTCDate(d.getUTCDate() - 4);
        const startDate = d.toISOString().slice(0, 10);
        const data = await getWeatherForDateRange(
          report.locationId,
          startDate,
          report.date,
        );
        const tripDay = data.find((w) => w.date === report.date);
        if (!tripDay) return null;
        const priorRainfall = data
          .filter((w) => w.date !== report.date)
          .reduce(
            (sum, w) =>
              sum + (w.precipitationSum ? parseFloat(w.precipitationSum) : 0),
            0,
          );
        return { ...tripDay, priorRainfall };
      },
    }),
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

type PaginatedResult = Awaited<ReturnType<typeof getPaginatedReportsGQL>>;
type PaginatedReportRow = PaginatedResult["reports"][number];

const ReportListAuthorType = builder.objectRef<{
  id: number;
  name: string;
}>("ReportListAuthor");
ReportListAuthorType.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
  }),
});

const ReportListLocationType = builder.objectRef<{
  id: number;
  name: string;
  usgsLocationId: string | null;
}>("ReportListLocation");
ReportListLocationType.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    name: t.exposeString("name"),
    usgsLocationId: t.exposeString("usgsLocationId", { nullable: true }),
  }),
});

const PaginatedReportItemType = builder.objectRef<PaginatedReportRow>(
  "PaginatedReportItem",
);
PaginatedReportItemType.implement({
  fields: (t) => ({
    id: t.exposeInt("id"),
    date: t.exposeString("date"),
    catchCount: t.exposeInt("catchCount"),
    notes: t.exposeString("notes"),
    author: t.field({ type: ReportListAuthorType, resolve: (r) => r.author }),
    location: t.field({
      type: ReportListLocationType,
      resolve: (r) => r.location,
    }),
    // TODO: replace with a DataLoader to batch getFirstImageKeysByReportIds across all reports in a request (avoids N+1)
    thumbnailUrl: t.field({
      type: "String",
      nullable: true,
      resolve: async (report) => {
        const keyMap = await getFirstImageKeysByReportIds([report.id]);
        const key = keyMap.get(report.id);
        return key ? getSignedImageUrl(key) : null;
      },
    }),
  }),
});

const ReportPageType = builder.objectRef<PaginatedResult>("ReportPage");
ReportPageType.implement({
  fields: (t) => ({
    reports: t.field({
      type: [PaginatedReportItemType],
      resolve: (page) => page.reports,
    }),
    nextCursor: t.exposeString("nextCursor", { nullable: true }),
  }),
});

builder.queryField("paginatedReports", (t) =>
  t.field({
    type: ReportPageType,
    args: {
      cursor: t.arg.string({ required: false }),
      limit: t.arg.int({ required: false }),
      locationId: t.arg.int({ required: false }),
      authorId: t.arg.int({ required: false }),
    },
    resolve: async (_root, args, ctx) => {
      return getPaginatedReportsGQL(
        args,
        parseInt(ctx.currentUserId as string),
      );
    },
  }),
);

const TopLocationByMonthType =
  builder.objectRef<TopLocationByMonth>("TopLocationByMonth");
TopLocationByMonthType.implement({
  fields: (t) => ({
    locationId: t.exposeInt("locationId"),
    locationName: t.exposeString("locationName"),
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
