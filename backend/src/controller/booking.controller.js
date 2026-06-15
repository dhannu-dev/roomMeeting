import mongoose from "mongoose";
import { Booking } from "../models/booking.model.js";
import { Room } from "../models/room.model.js";
import { Waitlist } from "../models/waitlist.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const convertToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

export const createBooking = asyncHandler(async (req, res) => {
  const { roomId, date, startTime, endTime, bookedBy, email, title } = req.body;

  if (!roomId || !date || !startTime || !endTime || !bookedBy || !email || !title) {
    throw new ApiError(400, "All fields are required");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const newStart = convertToMinutes(startTime);
  const newEnd = convertToMinutes(endTime);

  if (newEnd <= newStart) {
    throw new ApiError(400, "End time must be after start time");
  }

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const bufferMins = room.bufferMins || 10;
  const session = await mongoose.startSession();

  try {
    let booking;

    await session.withTransaction(async () => {
      const existingBookings = await Booking.find({
        roomId,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: "confirmed",
      }).session(session);

      const conflict = existingBookings.find((existing) => {
        const existStart = convertToMinutes(existing.startTime);
        const existEnd = convertToMinutes(existing.endTime);
        const existBufferEnd = existEnd + bufferMins;

        const directOverlap = newStart < existEnd && newEnd > existStart;
        const bufferConflict = newStart >= existEnd && newStart < existBufferEnd;

        return directOverlap || bufferConflict;
      });

      if (conflict) {
        throw new ApiError(
          409,
          "One or more slots are no longer available (conflicts with existing booking or buffer time)",
        );
      }

      const created = await Booking.create(
        [
          {
            roomId,
            date,
            startTime,
            endTime,
            bookedBy,
            email,
            title,
          },
        ],
        { session },
      );

      booking = created[0];
    });

    return res
      .status(201)
      .json(new ApiResponse(201, booking, "Booking created successfully"));
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Booking failed: " + error.message);
  } finally {
    await session.endSession();
  }
});

export const getBookingByEmail = asyncHandler(async (req, res) => {
  const { email } = req.query;
  if (!email) {
    throw new ApiError(400, "Email is required");
  }
  const bookings = await Booking.find({ email }).populate("roomId");
  const waitlistEntries = await Waitlist.find({ email }).populate("roomId");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { bookings, waitlist: waitlistEntries },
        "Bookings fetched successfully",
      ),
    );
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid booking ID");
  }

  const session = await mongoose.startSession();

  try {
    let result = {};

    await session.withTransaction(async () => {
      const booking = await Booking.findById(id).session(session);

      if (!booking) {
        throw new ApiError(404, "Booking not found");
      }

      if (booking.status !== "confirmed") {
        throw new ApiError(400, "Booking already cancelled");
      }

      const bookingStart = new Date(booking.date);
      const [hours, minutes] = booking.startTime.split(":").map(Number);
      bookingStart.setHours(hours, minutes, 0, 0);

      const now = new Date();

      if (bookingStart < now) {
        throw new ApiError(400, "Cannot cancel past bookings");
      }

      const hoursUntilStart = (bookingStart - now) / (1000 * 60 * 60);

      const newStatus =
        hoursUntilStart >= 2 ? "cancelled-refundable" : "cancelled-non-refundable";

      await Booking.findByIdAndUpdate(
        id,
        { $set: { status: newStatus } },
        { session },
      );

      const waitlisted = await Waitlist.findOne({
        roomId: booking.roomId,
        date: booking.date,
        startTime: booking.startTime,
      })
        .sort({ position: 1 })
        .session(session);

      let promoted = null;

      if (waitlisted) {
        const created = await Booking.create(
          [
            {
              roomId: booking.roomId,
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
              bookedBy: waitlisted.name,
              email: waitlisted.email,
              title: "Waitlist Promotion",
              status: "confirmed",
            },
          ],
          { session },
        );

        promoted = created[0];

        await Waitlist.findByIdAndDelete(waitlisted._id).session(session);
      }

      result = {
        booking: { ...booking.toObject(), status: newStatus },
        promoted: promoted
          ? {
              bookedBy: promoted.bookedBy,
              email: promoted.email,
              startTime: promoted.startTime,
              endTime: promoted.endTime,
            }
          : null,
        newStatus,
      };
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { booking: result.booking, promoted: result.promoted },
          result.promoted
            ? `Booking cancelled. ${result.promoted.bookedBy} was promoted from waitlist.`
            : `Booking cancelled successfully (${result.newStatus})`,
        ),
      );
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Cancel failed: " + error.message);
  } finally {
    await session.endSession();
  }
});
