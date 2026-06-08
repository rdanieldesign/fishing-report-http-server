import { defineRelations } from "drizzle-orm";
import { schema } from "./schema";

export const allRelations = defineRelations(schema, (r) => ({
  users: {
    reports: r.many.reports({ alias: "author" }),
    friendsAsUserOne: r.many.friends({ alias: "userOne" }),
    friendsAsUserTwo: r.many.friends({ alias: "userTwo" }),
  },
  locations: {
    reports: r.many.reports(),
    weatherDaily: r.many.weatherDaily(),
    usgsReadings: r.many.usgsReadings(),
  },
  weatherDaily: {
    location: r.one.locations({
      from: r.weatherDaily.locationId,
      to: r.locations.id,
    }),
  },
  reports: {
    author: r.one.users({
      from: r.reports.authorId,
      to: r.users.id,
      alias: "author",
    }),
    location: r.one.locations({
      from: r.reports.locationId,
      to: r.locations.id,
    }),
    reportImages: r.many.reportImages(),
  },
  reportImages: {
    report: r.one.reports({
      from: r.reportImages.reportId,
      to: r.reports.id,
    }),
  },
  friends: {
    userOne: r.one.users({
      from: r.friends.userOneId,
      to: r.users.id,
      alias: "userOne",
    }),
    userTwo: r.one.users({
      from: r.friends.userTwoId,
      to: r.users.id,
      alias: "userTwo",
    }),
  },
  usgsReadings: {
    location: r.one.locations({
      from: r.usgsReadings.locationId,
      to: r.locations.id,
    }),
  },
}));
