import { Room } from "../models/room.model.js";
import { Waitlist } from "../models/waitlist.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createWaitlist = asyncHandler(async (req, res) => {
  const { roomId, date, startTime, email, name } = req.body;
  if (!roomId || !date || !startTime || !email || !name) {
    throw new ApiError(400, "All Fields are required");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  const count = await Waitlist.countDocuments({
    roomId,
    date: new Date(date),
    startTime,
  });

  const position = count + 1;
  const waitlist = await Waitlist.create({
    roomId,
    date,
    startTime,
    email,
    name,
    position,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        waitlist,
        `Added to waitlist. Your position is ${position}`,
      ),
    );
});
