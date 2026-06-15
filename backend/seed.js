import "dotenv/config";
import mongoose from "mongoose";
import { Room } from "./src/models/room.model.js";
import { Booking } from "./src/models/booking.model.js";

const rooms = [
  { name: "Board Room", location: "Floor 3, East Wing", capacity: 20, bufferMins: 15 },
  { name: "Huddle Room A", location: "Floor 1, West Wing", capacity: 6, bufferMins: 10 },
  { name: "Conference Hall", location: "Floor 5, Main Building", capacity: 50, bufferMins: 15 },
  { name: "Focus Pod", location: "Floor 2, Quiet Zone", capacity: 4, bufferMins: 5 },
];

function getDateStr(daysFromNow) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0];
}

function getTodayDate() {
  return new Date();
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Room.deleteMany({});
    await Booking.deleteMany({});
    console.log("Cleared existing data");

    const createdRooms = await Room.insertMany(rooms);
    console.log(`Created ${createdRooms.length} rooms`);

    const bookings = [];
    const today = getDateStr(0);
    const tomorrow = getDateStr(1);
    const todayDate = getTodayDate();

    bookings.push({
      roomId: createdRooms[0]._id,
      date: new Date(today),
      startTime: "09:00",
      endTime: "10:00",
      bookedBy: "Alice Johnson",
      email: "alice@example.com",
      title: "Sprint Planning",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[0]._id,
      date: new Date(today),
      startTime: "10:00",
      endTime: "11:00",
      bookedBy: "Bob Smith",
      email: "bob@example.com",
      title: "Design Review",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[0]._id,
      date: new Date(today),
      startTime: "14:00",
      endTime: "15:00",
      bookedBy: "Alice Johnson",
      email: "alice@example.com",
      title: "1:1 with Manager",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[1]._id,
      date: new Date(today),
      startTime: "11:00",
      endTime: "11:30",
      bookedBy: "Charlie Brown",
      email: "charlie@example.com",
      title: "Quick Sync",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[2]._id,
      date: new Date(today),
      startTime: "09:00",
      endTime: "10:30",
      bookedBy: "Diana Prince",
      email: "diana@example.com",
      title: "All Hands Meeting",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[2]._id,
      date: new Date(today),
      startTime: "10:30",
      endTime: "12:00",
      bookedBy: "Eve Wilson",
      email: "eve@example.com",
      title: "Quarterly Review",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[0]._id,
      date: new Date(tomorrow),
      startTime: "08:00",
      endTime: "09:00",
      bookedBy: "Frank Lee",
      email: "frank@example.com",
      title: "Morning Standup",
      status: "confirmed",
    });

    bookings.push({
      roomId: createdRooms[1]._id,
      date: new Date(tomorrow),
      startTime: "13:00",
      endTime: "14:00",
      bookedBy: "Grace Kim",
      email: "grace@example.com",
      title: "Client Call",
      status: "confirmed",
    });

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    let nearFutureStartHour = currentHour + 1;
    if (nearFutureStartHour >= 20) nearFutureStartHour = 8;

    const nearFutureStart = `${String(nearFutureStartHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    const nearFutureEnd = `${String(nearFutureStartHour + 1).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    bookings.push({
      roomId: createdRooms[0]._id,
      date: todayDate,
      startTime: nearFutureStart,
      endTime: nearFutureEnd,
      bookedBy: "Hank Martin",
      email: "hank@example.com",
      title: "Product Demo (Refundable if cancelled now)",
      status: "confirmed",
    });

    const nonRefundableStartHour = (currentHour + 2) % 24;
    const nonRefundableStart = `${String(nonRefundableStartHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
    const nonRefundableEnd = `${String((nonRefundableStartHour + 1) % 24).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    bookings.push({
      roomId: createdRooms[1]._id,
      date: todayDate,
      startTime: nonRefundableStart,
      endTime: nonRefundableEnd,
      bookedBy: "Ivy Chen",
      email: "ivy@example.com",
      title: "Tech Talk (Non-refundable after cutoff)",
      status: "confirmed",
    });

    await Booking.insertMany(bookings);
    console.log(`Created ${bookings.length} bookings`);
    console.log("  - 8 regular bookings across today and tomorrow");
    console.log(`  - 1 near-future booking at ${nearFutureStart} (refundable window)`);
    console.log(`  - 1 at ${nonRefundableStart} (non-refundable window)`);
    console.log("Seed completed!");
  } catch (error) {
    console.error("Seed failed:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
