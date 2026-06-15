"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

function formatTime(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function getTodayStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export default function RoomPage() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [date, setDate] = useState(getTodayStr());
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [waitlistSlot, setWaitlistSlot] = useState(null);
  const [waitlistForm, setWaitlistForm] = useState({ name: "", email: "" });
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistMsg, setWaitlistMsg] = useState(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      setError(null);
      setSelectedSlots([]);
      setShowForm(false);
      setSubmitMsg(null);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/room/${id}/availability?date=${date}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to fetch");
        setRoom(data.data.room);
        setSlots(data.data.slots);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [id, date]);

  const toggleSlot = (slot) => {
    if (slot.status !== "available") return;

    setSelectedSlots((prev) => {
      const exists = prev.find((s) => s.time === slot.time);
      if (exists) {
        return prev.filter((s) => s.time !== slot.time);
      }

      const slotMin = timeToMinutes(slot.time);
      const sorted = [...prev, slot].sort((a, b) => a.time.localeCompare(b.time));
      const sortedMins = sorted.map((s) => timeToMinutes(s.time));

      for (let i = 1; i < sortedMins.length; i++) {
        if (sortedMins[i] - sortedMins[i - 1] !== 30) {
          return prev;
        }
      }

      return sorted;
    });
  };

  const handleBook = () => {
    if (selectedSlots.length === 0) return;
    setShowForm(true);
  };

  const handleBookedSlotClick = (slot) => {
    if (slot.status !== "booked") return;
    setWaitlistSlot(slot);
    setWaitlistMsg(null);
    setWaitlistForm({ name: "", email: "" });
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    setWaitlistSubmitting(true);
    setWaitlistMsg(null);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/waitlist`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: id,
            date,
            startTime: waitlistSlot.time,
            email: waitlistForm.email,
            name: waitlistForm.name,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to join waitlist");
      setWaitlistMsg({ type: "success", text: data.message || "Added to waitlist!" });
      setWaitlistSlot(null);
      setWaitlistForm({ name: "", email: "" });
    } catch (err) {
      setWaitlistMsg({ type: "error", text: err.message });
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);

    const firstSlot = selectedSlots[0];
    const lastSlot = selectedSlots[selectedSlots.length - 1];
    const lastSlotMinutes = timeToMinutes(lastSlot.time);
    const endTime = minutesToTime(lastSlotMinutes + 30);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/booking`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId: id,
            date,
            startTime: firstSlot.time,
            endTime,
            bookedBy: formData.name,
            email: formData.email,
            title: formData.title,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Booking failed");
      setSubmitMsg({ type: "success", text: "Booking confirmed successfully!" });
      setSelectedSlots([]);
      setShowForm(false);
      setFormData({ name: "", email: "", title: "" });
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-muted shadow-sm transition-all hover:text-primary hover:shadow-md"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back to Rooms
      </Link>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-2xl border-2 border-danger/20 bg-danger-light p-5 text-center font-medium text-danger shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {submitMsg && (
        <div className={`mb-6 rounded-2xl p-5 text-center font-bold shadow-sm ${submitMsg.type === "success" ? "border-2 border-emerald-200 bg-success-light text-emerald-700" : "border-2 border-red-200 bg-danger-light text-red-700"}`}>
          <div className="flex items-center justify-center gap-2">
            {submitMsg.type === "success" ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            )}
            {submitMsg.text}
          </div>
        </div>
      )}

      {!loading && !error && room && (
        <>
          <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-accent to-pink p-6 shadow-lg shadow-primary/15">
            <h1 className="text-3xl font-extrabold text-white drop-shadow-sm">{room.name}</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-white/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {room.location}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                {room.capacity} seats
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                {room.bufferMins || 10}m buffer
              </span>
            </p>
          </div>

          <div className="mb-6 rounded-2xl border-2 border-white bg-white p-5 shadow-md">
            <label htmlFor="date-picker" className="mb-2 block text-sm font-bold text-foreground">
              Pick a Date
            </label>
            <input
              id="date-picker"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full max-w-xs rounded-xl border-2 border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="mb-5 flex flex-wrap items-center gap-4 text-sm font-semibold">
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-sm shadow-emerald-200" />
              Available
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-lg bg-gradient-to-br from-red-400 to-red-500 shadow-sm shadow-red-200" />
              Booked
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-lg bg-gradient-to-br from-yellow-400 to-amber-500 shadow-sm shadow-yellow-200" />
              Buffer
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm shadow-primary/20 ring-2 ring-white" />
              Selected
            </span>
          </div>

          <div className="rounded-2xl border-2 border-white bg-white p-4 shadow-md">
            <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12">
              {slots.map((slot) => {
                const isSelected = selectedSlots.some((s) => s.time === slot.time);
                const status = isSelected ? "selected" : slot.status;

                const base = "relative flex flex-col items-center justify-center rounded-xl px-2 py-3.5 text-xs font-bold transition-all duration-200 shadow-sm";
                const styles = {
                  available: "bg-gradient-to-b from-emerald-50 to-emerald-100 text-emerald-700 border-2 border-emerald-200 hover:border-emerald-400 hover:from-emerald-100 hover:to-emerald-200 hover:shadow-md cursor-pointer active:scale-95",
                  booked: "bg-gradient-to-b from-red-50 to-red-100 text-red-400 border-2 border-red-200 hover:border-red-400 hover:from-red-100 hover:to-red-200 hover:shadow-md cursor-pointer active:scale-95",
                  buffer: "bg-gradient-to-b from-yellow-50 to-amber-100 text-amber-500 border-2 border-amber-200 cursor-not-allowed opacity-60",
                  selected: "bg-gradient-to-b from-primary to-accent text-white border-2 border-primary shadow-lg shadow-primary/25 cursor-pointer scale-105",
                };

                const handleClick = slot.status === "booked"
                  ? () => handleBookedSlotClick(slot)
                  : () => toggleSlot(slot);

                return (
                  <button
                    key={slot.time}
                    onClick={handleClick}
                    disabled={slot.status === "buffer"}
                    className={`${base} ${styles[status]}`}
                    title={slot.status === "booked" ? `${formatTime(slot.time)} — Click to join waitlist` : `${formatTime(slot.time)} — ${status}`}
                  >
                    <span className="text-[10px] opacity-70">{formatTime(slot.time)}</span>
                    {isSelected && (
                      <svg className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-white text-primary shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedSlots.length > 0 && (
            <div className="mt-6 overflow-hidden rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-pink/5 p-5 shadow-lg shadow-primary/10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-bold text-foreground">
                    {selectedSlots.length} slot{selectedSlots.length > 1 ? "s" : ""} selected
                  </p>
                  <p className="text-sm text-muted">
                    {formatTime(selectedSlots[0].time)} to{" "}
                    {formatTime(minutesToTime(timeToMinutes(selectedSlots[selectedSlots.length - 1].time) + 30))}
                  </p>
                </div>
                <button
                  onClick={handleBook}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 active:scale-95"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Book Now
                </button>
              </div>
            </div>
          )}

          {showForm && (
            <div className="mt-6 overflow-hidden rounded-2xl border-2 border-white bg-white p-6 shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground">Complete Your Booking</h3>
              </div>
              <form onSubmit={handleSubmitBooking} className="space-y-5">
                <div>
                  <label htmlFor="book-name" className="mb-1.5 block text-sm font-bold text-foreground">Your Name</label>
                  <input
                    id="book-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="book-email" className="mb-1.5 block text-sm font-bold text-foreground">Email</label>
                  <input
                    id="book-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label htmlFor="book-title" className="mb-1.5 block text-sm font-bold text-foreground">Meeting Title</label>
                  <input
                    id="book-title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="Sprint Planning"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 disabled:opacity-50 active:scale-95"
                  >
                    {submitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Booking...
                      </>
                    ) : (
                      "Confirm Booking"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border-2 border-border px-6 py-3 text-sm font-bold text-muted transition-all hover:bg-card-hover hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {waitlistSlot && (
            <div className="mt-6 overflow-hidden rounded-2xl border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50 p-6 shadow-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange to-amber-500">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">Join Waitlist</h3>
                  <p className="text-sm text-muted">
                    {formatTime(waitlistSlot.time)} is booked. You&apos;ll be notified if it opens up.
                  </p>
                </div>
              </div>
              <form onSubmit={handleJoinWaitlist} className="space-y-4">
                <div>
                  <label htmlFor="wl-name" className="mb-1.5 block text-sm font-bold text-foreground">Your Name</label>
                  <input
                    id="wl-name"
                    type="text"
                    required
                    value={waitlistForm.name}
                    onChange={(e) => setWaitlistForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label htmlFor="wl-email" className="mb-1.5 block text-sm font-bold text-foreground">Email</label>
                  <input
                    id="wl-email"
                    type="email"
                    required
                    value={waitlistForm.email}
                    onChange={(e) => setWaitlistForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    placeholder="john@example.com"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={waitlistSubmitting}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange to-amber-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange/25 transition-all hover:shadow-xl hover:shadow-orange/30 hover:brightness-110 disabled:opacity-50 active:scale-95"
                  >
                    {waitlistSubmitting ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Joining...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Join Waitlist
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaitlistSlot(null)}
                    className="rounded-xl border-2 border-border px-6 py-3 text-sm font-bold text-muted transition-all hover:bg-card-hover hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {waitlistMsg && (
                <div className={`mt-4 rounded-xl p-4 text-sm font-bold ${waitlistMsg.type === "success" ? "bg-success-light text-emerald-700 border-2 border-emerald-200" : "bg-danger-light text-red-700 border-2 border-red-200"}`}>
                  <div className="flex items-center gap-2">
                    {waitlistMsg.type === "success" ? (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    )}
                    {waitlistMsg.text}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
