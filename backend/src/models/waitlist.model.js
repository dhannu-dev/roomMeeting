import mongoose from "mongoose";

const waitlistSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: { type: Date, required: true },
    startTime: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    position: { type: Number, required: true },
  },
  { timestamps: true },
);

waitlistSchema.index(
  { roomId: 1, date: 1, startTime: 1, email: 1 },
  { unique: true },
);

export const Waitlist = mongoose.model("Waitlist", waitlistSchema);
