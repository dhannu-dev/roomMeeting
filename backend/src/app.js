import "dotenv/config";
import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

import roomRouter from "./routes/room.routes.js";
import bookingRouter from "./routes/booking.routes.js";
import waitlistRouter from "./routes/waitlist.routes.js";

app.use("/api/v1/room", roomRouter);
app.use("/api/v1/booking", bookingRouter);
app.use("/api/v1/waitlist", waitlistRouter);

app.get("/user", (req, res) => {
  res.json({ message: "Welcome dhannu" });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: err.message || "Internal Server Error",
    data: err.data || null,
    errors: err.errors || [],
  });
});

export default app;
