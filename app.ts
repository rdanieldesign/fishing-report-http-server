import cors from "cors";
import express from "express";
import { authRouter } from "./features/auth/auth.routes";
import { friendsRouter } from "./features/friends/friends.routes";
import { locationsRouter } from "./features/locations/locations.routes";
import { reportsRouter } from "./features/reports/reports.routes";
import { usersRouter } from "./features/users/users.routes";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { schema } from "./graphql/schema";
import { authenticate } from "./middleware/auth";

export const app = express();
const apolloServer = new ApolloServer({
  schema,
});

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://fishing-report.site",
      "https://www.fishing-report.site",
      "https://your-app.vercel.app",
      "https://studio.apollographql.com",
    ],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/api/locations", locationsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/users", usersRouter);
app.use("/api/friends", friendsRouter);
app.use("/api/auth", authRouter);

async function startApollo() {
  await apolloServer.start();
  app.use(
    "/graphql",
    express.json(),
    authenticate,
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({
        currentUserId: req.authenticatedUserId?.toString(),
      }),
    }),
  );
}

export const ready = startApollo();
