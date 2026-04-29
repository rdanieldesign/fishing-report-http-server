import { builder } from "../../graphql/builder";
import { getReports } from "./reports.service";

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

builder.queryField("allReports", (t) =>
  t.drizzleField({
    type: [ReportType],
    resolve: async (query, root, args, ctx, info) => {
      // TODO: pass query to orm to only select requested fields
      return getReports({}, parseInt(ctx.currentUserId as string));
    },
  }),
);
