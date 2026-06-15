import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "RoomIt — Meeting Room Booking",
  description: "Book meeting rooms with ease. Real-time availability, buffer times, and waitlist support.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-50 bg-gradient-to-r from-primary via-accent to-pink shadow-lg shadow-primary/10">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 text-xl font-bold text-white drop-shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              RoomIt
            </Link>
            <nav className="flex items-center gap-1.5">
              <Link
                href="/"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white/90 transition-all hover:bg-white/20 hover:text-white hover:shadow-sm"
              >
                Rooms
              </Link>
              <Link
                href="/bookings"
                className="rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:shadow-sm"
              >
                My Bookings
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-border/50 bg-white/60 py-8 text-center backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span>RoomIt &copy; {new Date().getFullYear()} &middot; Built with Next.js &amp; Express</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
