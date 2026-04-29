import SchemaBuilder from "@pothos/core";
import DrizzlePlugin from "@pothos/plugin-drizzle";
import { getTableConfig } from "drizzle-orm/mysql-core";
import { db } from "../db";
import { allRelations } from "../db/relations";
import { GraphQLJSON } from "graphql-scalars";

export interface Context {
  currentUserId?: string;
}

interface PothosTypes {
  DrizzleRelations: typeof allRelations;
  Context: Context;
  Scalars: {
    JSON: { Input: any; Output: any };
  };
}

export const builder = new SchemaBuilder<PothosTypes>({
  plugins: [DrizzlePlugin],
  drizzle: {
    client: db,
    getTableConfig,
    relations: allRelations,
  },
});

builder.addScalarType("JSON", GraphQLJSON, {});

builder.queryType({});
