import cors from "cors";
import express from "express";
import { authRouter } from "./features/auth/auth.routes";
import { friendsRouter } from "./features/friends/friends.routes";
import { locationsRouter } from "./features/locations/locations.routes";
import { reportsRouter } from "./features/reports/reports.routes";
import { usersRouter } from "./features/users/users.routes";

export const app = express();

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
