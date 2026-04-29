import { builder } from "../../graphql/builder";
import { db } from "../../db";

// This tells Pothos how to map the 'reports' table to a GraphQL 'Report' type
builder.drizzleObject("reports", {
  name: "Report",
  fields: (t) => ({
    id: t.exposeInt("id"),
    date: t.exposeString("date"),
    catchCount: t.exposeInt("catchCount"),
    notes: t.exposeString("notes"),
    authorId: t.exposeInt("authorId"),
    imageIds: t.exposeString("imageIds"),
    // You can also add custom fields that aren't in the DB
    // upperCaseEmail: t.string({
    //   resolve: (user) => user.email.toUpperCase(),
    // }),
  }),
});

// Add a query to fetch all reports
builder.queryField("allReports", (t) =>
  t.drizzleField({
    type: ["reports"], // Returns an array of Report objects
    resolve: async (query, root, args, ctx, info) => {
      // Drizzle handles the heavy lifting here
      return await db.query.reports.findMany(query());
    },
  }),
);
