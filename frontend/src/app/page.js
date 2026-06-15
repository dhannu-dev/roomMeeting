"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CARD_THEMES = [
  { bg: "bg-blue-light", icon: "text-blue", ring: "ring-blue/20", hover: "hover:border-blue/40 hover:shadow-blue/10" },
  { bg: "bg-pink-light", icon: "text-pink", ring: "ring-pink/20", hover: "hover:border-pink/40 hover:shadow-pink/10" },
  { bg: "bg-cyan-light", icon: "text-cyan", ring: "ring-cyan/20", hover: "hover:border-cyan/40 hover:shadow-cyan/10" },
  { bg: "bg-orange-light", icon: "text-orange", ring: "ring-orange/20", hover: "hover:border-orange/40 hover:shadow-orange/10" },
  { bg: "bg-success-light", icon: "text-success", ring: "ring-success/20", hover: "hover:border-success/40 hover:shadow-success/10" },
  { bg: "bg-primary-light", icon: "text-primary", ring: "ring-primary/20", hover: "hover:border-primary/40 hover:shadow-primary/10" },
];

const ROOM_ICONS = [
  <svg key="0" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
  </svg>,
  <svg key="1" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
  </svg>,
  <svg key="2" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3h.008v.008h-.008V10.5zm0 3h.008v.008h-.008V13.5zm0 3h.008v.008h-.008V16.5z" />
  </svg>,
  <svg key="3" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>,
];

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/room`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load rooms");
        setRooms(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  return (
    <div>
      <div className="mb-10 overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-accent to-pink p-8 text-white shadow-xl shadow-primary/15">
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
            Meeting Rooms
          </h1>
          <p className="mt-2 text-lg text-white/80">
            Select a room to view availability and make a booking.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Available
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-red-300" />
              Booked
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-sm font-medium backdrop-blur-sm">
              <span className="h-2 w-2 rounded-full bg-yellow-300" />
              Buffer
            </span>
          </div>
        </div>
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      </div>

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

      {!loading && !error && rooms.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-border bg-white/60 py-20 text-center backdrop-blur-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-light/30 to-accent/20">
            <svg className="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p className="mt-5 text-xl font-bold text-foreground">No rooms available</p>
          <p className="mt-1.5 text-sm text-muted">Check back later or contact your admin.</p>
        </div>
      )}

      {!loading && !error && rooms.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room, i) => {
            const theme = CARD_THEMES[i % CARD_THEMES.length];
            return (
              <Link
                key={room._id}
                href={`/rooms/${room._id}`}
                className={`group relative overflow-hidden rounded-2xl border-2 border-white bg-white p-6 shadow-md transition-all duration-300 ${theme.hover} hover:-translate-y-1 hover:shadow-xl`}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.07] transition-all duration-300 group-hover:scale-150 group-hover:opacity-10"
                  style={{ background: "currentColor" }}
                />
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${theme.bg} ${theme.icon} ring-4 ${theme.ring} transition-transform duration-300 group-hover:scale-110`}>
                  {ROOM_ICONS[i % ROOM_ICONS.length]}
                </div>
                <h2 className="text-xl font-bold text-foreground">{room.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {room.location}
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-light px-3 py-1 text-xs font-semibold text-blue">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                    </svg>
                    {room.capacity} seats
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-light px-3 py-1 text-xs font-semibold text-orange">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {room.bufferMins || 10}m buffer
                  </span>
                </div>
                <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary opacity-0 transition-all duration-300 group-hover:opacity-100">
                  View availability
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
