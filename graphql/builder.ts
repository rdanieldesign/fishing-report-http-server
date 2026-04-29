import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { db } from "../db";
import { allRelations } from "../db/relations";

interface PothosTypes {
  DrizzleRelations: typeof allRelations;
}

export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin],
  drizzle: {
    client: db,
    getTableConfig,
    relations: allRelations,
  },
});

builder.queryType({});
