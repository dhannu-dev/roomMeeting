import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },

    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    bookedBy: { type: String, required: true },
    email: { type: String, required: true, index: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled-refundable", "cancelled-non-refundable"],
      default: "confirmed",
    },
    version: { type: Number, default: 1 },
  },
  {
    timestamps: true,
  },
);

bookingSchema.index({ roomId: 1, date: 1, startTime: 1 }, { unique: true });

export const Booking = mongoose.model("Booking", bookingSchema);
