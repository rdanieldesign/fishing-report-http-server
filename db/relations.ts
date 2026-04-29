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
}));
