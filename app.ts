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
  // 2. Start the Apollo background processes
  await apolloServer.start();

  // 3. Apply the middleware to your Express app
  app.use(
    "/graphql",
    express.json(), // Required for parsing request bodies
    expressMiddleware(apolloServer, {
      // Optional: Pass context (like current user) to your resolvers
      context: async ({ req }) => ({
        token: req.headers.authorization,
      }),
    }),
  );
}

startApollo();
