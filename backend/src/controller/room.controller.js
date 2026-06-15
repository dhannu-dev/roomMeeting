import { Booking } from "../models/booking.model.js";
import { Room } from "../models/room.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const convertToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const isWithinBuffer = (slotMinutes, bookings, bufferMins) => {
  for (const booking of bookings) {
    const bookingEnd = convertToMinutes(booking.endTime);
    const bufferEnd = bookingEnd + bufferMins;

    if (slotMinutes >= bookingEnd && slotMinutes < bufferEnd) {
      return true;
    }
  }
  return false;
};

export const createRoom = asyncHandler(async (req, res) => {
  const { name, location, capacity, bufferMins } = req.body;
  if (!name || !location || !capacity) {
    throw new ApiError(400, "All Fields are required");
  }
  const existingRoom = await Room.findOne({ name: name.trim() });
  if (existingRoom) {
    throw new ApiError(409, "Room Already Exists");
  }
  const room = await Room.create({
    name,
    location,
    capacity,
    bufferMins,
  });

  if (!room) {
    throw new ApiError(500, "Room could not be created");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, room, "Room created successfully"));
});

export const getAllRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find();
  return res
    .status(200)
    .json(new ApiResponse(200, rooms, "All Rooms Fetched Successfully"));
});

export const getRoomAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new ApiError(400, "Date is required");
  }

  const room = await Room.findById(id);

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const startOfDay = new Date(date);
  const endOfDay = new Date(date);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const bookings = await Booking.find({
    roomId: id,
    date: {
      $gte: startOfDay,
      $lt: endOfDay,
    },
    status: "confirmed",
  });

  const bufferMins = room.bufferMins || 10;

  const slots = [];

  for (let hour = 8; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      slots.push(
        `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
      );
    }
  }

  const availability = slots.map((slotTime) => {
    const slotMinutes = convertToMinutes(slotTime);

    const isBooked = bookings.some((booking) => {
      const start = convertToMinutes(booking.startTime);
      const end = convertToMinutes(booking.endTime);
      return slotMinutes >= start && slotMinutes < end;
    });

    const isBuffer = !isBooked && isWithinBuffer(slotMinutes, bookings, bufferMins);

    return {
      time: slotTime,
      status: isBooked ? "booked" : isBuffer ? "buffer" : "available",
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        room,
        date,
        slots: availability,
      },
      "Availability fetched successfully",
    ),
  );
});
