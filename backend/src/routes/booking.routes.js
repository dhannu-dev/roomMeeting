import { Router } from "express";
import {
  cancelBooking,
  createBooking,
  getBookingByEmail,
} from "../controller/booking.controller.js";

const router = Router();

router.post("/", createBooking);
router.get("/", getBookingByEmail);
router.patch("/:id/cancel", cancelBooking);

export default router;
