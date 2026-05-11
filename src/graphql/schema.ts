import { builder } from "./builder";
import "../features/reports/reports.graphql";

export const schema = builder.toSchema();
