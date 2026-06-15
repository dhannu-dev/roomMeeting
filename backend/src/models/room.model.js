import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    capacity: {
      type: Number,
      required: true,
    },
    bufferMins: {
      type: Number,
      default: 10,
    },
  },
  { timestamps: true },
);

export const Room = mongoose.model("Room", roomSchema);
