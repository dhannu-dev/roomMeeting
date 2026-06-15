"use client";

import { useState } from "react";

const STATUS_STYLES = {
  confirmed: "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-2 border-emerald-200 shadow-sm shadow-emerald-100",
  waitlist: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-2 border-amber-200 shadow-sm shadow-amber-100",
  promoted: "bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border-2 border-violet-200 shadow-sm shadow-violet-100",
  "cancelled-refundable": "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-2 border-amber-200 shadow-sm shadow-amber-100",
  "cancelled-non-refundable": "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-200 shadow-sm shadow-red-100",
};

const STATUS_LABELS = {
  confirmed: "Confirmed",
  waitlist: "Waitlisted",
  promoted: "Promoted from Waitlist",
  "cancelled-refundable": "Cancelled (Refundable)",
  "cancelled-non-refundable": "Cancelled (Non-refundable)",
};

const STATUS_ICONS = {
  confirmed: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  waitlist: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  promoted: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
    </svg>
  ),
  "cancelled-refundable": (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  "cancelled-non-refundable": (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
};

function formatDate(dateStr) {
  const dateOnly = dateStr.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(time) {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export default function BookingsPage() {
  const [email, setEmail] = useState("");
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(null);

  const fetchBookings = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/booking?email=${encodeURIComponent(email)}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");
      setBookings(data.data?.bookings || []);
      setWaitlist(data.data?.waitlist || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/booking/${bookingId}/cancel`,
        { method: "PATCH" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Cancel failed");
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: data.data.status } : b
        )
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setCancellingId(null);
      setConfirmCancel(null);
    }
  };

  return (
    <div>
      <div className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-accent to-pink p-8 shadow-xl shadow-primary/15">
        <h1 className="text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
          My Bookings
        </h1>
        <p className="mt-2 text-lg text-white/80">
          Look up your bookings by email address.
        </p>
      </div>

      <form onSubmit={fetchBookings} className="mb-8">
        <div className="flex gap-3 rounded-2xl border-2 border-white bg-white p-2 shadow-md">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full rounded-xl border-2 border-border bg-background py-3 pl-12 pr-4 text-sm font-medium text-foreground shadow-sm transition-all focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:brightness-110 disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            )}
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-6 rounded-2xl border-2 border-danger/20 bg-danger-light p-5 text-center font-medium text-danger shadow-sm">
          <div className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {searched && !loading && bookings.length === 0 && waitlist.length === 0 && !error && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white/60 py-20 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-light/30 to-accent/20">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="mt-5 text-xl font-bold text-foreground">No bookings found</p>
          <p className="mt-1.5 text-sm text-muted">Try a different email or book a room first.</p>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-foreground">Confirmed Bookings</h2>
          {bookings.map((booking) => {
            const isConfirmed = booking.status === "confirmed";
            const isCancelling = cancellingId === booking._id;
            const showConfirm = confirmCancel === booking._id;

            return (
              <div
                key={booking._id}
                className="group overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-primary/5"
              >
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-pink" />
                <div className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-foreground">
                          {booking.title}
                        </h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[booking.status]}`}>
                          {STATUS_ICONS[booking.status]}
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-light/60 px-3 py-1 text-xs text-blue">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          {formatDate(booking.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-light/60 px-3 py-1 text-xs text-orange">
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatTime(booking.startTime)} — {formatTime(booking.endTime)}
                        </span>
                        {booking.roomId && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-light/60 px-3 py-1 text-xs text-pink">
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            {booking.roomId.name || "Room"}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-xs font-medium text-muted">
                        Booked by <span className="font-bold text-foreground">{booking.bookedBy}</span>
                      </p>
                    </div>

                    <div className="flex-shrink-0">
                      {isConfirmed && !showConfirm && (
                        <button
                          onClick={() => setConfirmCancel(booking._id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border-2 border-red-200 px-4 py-2.5 text-sm font-bold text-red-500 transition-all hover:border-red-300 hover:bg-red-50 hover:text-red-600 hover:shadow-sm active:scale-95"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Cancel
                        </button>
                      )}
                      {isConfirmed && showConfirm && (
                        <div className="flex items-center gap-2 rounded-xl border-2 border-red-100 bg-red-50 p-2">
                          <span className="px-2 text-xs font-bold text-red-500">Cancel?</span>
                          <button
                            onClick={() => handleCancel(booking._id)}
                            disabled={isCancelling}
                            className="rounded-lg bg-gradient-to-r from-red-500 to-rose-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm shadow-red-200 transition-all hover:brightness-110 disabled:opacity-50"
                          >
                            {isCancelling ? "..." : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmCancel(null)}
                            className="rounded-lg border-2 border-border bg-white px-3.5 py-1.5 text-xs font-bold text-muted transition-all hover:bg-card-hover"
                          >
                            No
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {waitlist.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Waitlisted Slots</h2>
          {waitlist.map((entry) => (
            <div
              key={entry._id}
              className="group overflow-hidden rounded-2xl border-2 border-white bg-white shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400" />
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-bold text-foreground">
                    {entry.title || "No Title"}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-2 border-amber-200 shadow-sm shadow-amber-100">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Waitlisted
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-muted">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-light/60 px-3 py-1 text-xs text-blue">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    {formatDate(entry.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-light/60 px-3 py-1 text-xs text-orange">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {formatTime(entry.startTime)}
                  </span>
                  {entry.roomId && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-light/60 px-3 py-1 text-xs text-pink">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {entry.roomId.name || "Room"}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-light/60 px-3 py-1 text-xs text-purple">
                    Position #{entry.position}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-muted">
                  Waiting for <span className="font-bold text-foreground">{entry.name}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
