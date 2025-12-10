import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "@server/modules/auth/index.js";
import { chatRouter } from "@server/modules/chat/index.js";
import { comparisonRouter } from "@server/modules/comparison/index.js";

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://client:3000",
  process.env.NEXT_PUBLIC_URL || "",
].filter((origin) => origin.length > 0);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);
app.use("/api/comparison", comparisonRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
