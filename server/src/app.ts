import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "@server/modules/auth/index.js";
import { chatRouter } from "@server/modules/chat/index.js";
import { comparisonRouter } from "@server/modules/comparison/index.js";

const app = express();

app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_URL,
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
