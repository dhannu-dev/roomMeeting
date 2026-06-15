# RoomIt — Meeting Room Booking System

An internal tool for booking meeting rooms with real-time availability, waitlist auto-promotion, and database-level concurrency protection.

## Live Demo

- **Frontend:** [https://your-vercel-link.vercel.app](https://your-vercel-link.vercel.app)
- **Backend:** [https://your-render-link.onrender.com](https://your-render-link.onrender.com)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Express 5, Mongoose 9, Node.js |
| Database | MongoDB Atlas (Replica Set for transactions) |

## Extended Requirements Implemented

- [x] **4.2 — Waitlist with atomic auto-promotion** (Section 4)
- [x] **4.3 — Buffer time between bookings** (Section 4)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm)
- MongoDB Atlas connection string (replica set required for transactions)

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/roomit.git
cd roomit
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env   # or create .env manually
pnpm install
```

**Create `backend/.env`:**

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/meetingRooms?appName=Cluster0
CORS_ORIGIN=http://localhost:3000
```

**Seed the database:**

```bash
node seed.js
```

This creates:
- 4 rooms (Board Room, Huddle Room A, Conference Hall, Focus Pod)
- 10 bookings (8 regular + 2 near-future for refund testing)

**Start the backend:**

```bash
pnpm dev
```

Backend runs on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

**Create `frontend/.env`:**

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

**Start the frontend:**

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/room` | List all rooms |
| `GET` | `/api/v1/room/:id/availability?date=YYYY-MM-DD` | Slot grid for a room+date |
| `POST` | `/api/v1/room` | Create a new room |
| `POST` | `/api/v1/booking` | Create a booking (atomic) |
| `GET` | `/api/v1/booking?email=` | Get bookings + waitlist for an email |
| `PATCH` | `/api/v1/booking/:id/cancel` | Cancel a booking (atomic, with refund logic) |
| `POST` | `/api/v1/waitlist` | Join waitlist for a booked slot |

## How It Works

### User Flow

1. **Browse rooms** — Home page shows all available rooms with capacity and buffer info
2. **Check availability** — Click a room to see the 30-minute slot grid for a selected date
3. **Select slots** — Click green (available) slots; they must be adjacent
4. **Book** — Fill in name, email, meeting title → booking is created atomically
5. **Waitlist** — Click a red (booked) slot to join the waitlist; get auto-promoted when it's cancelled
6. **Manage bookings** — Look up bookings by email, cancel with refundable/non-refundable status

### Slot Colors

| Color | Status |
|-------|--------|
| 🟢 Green | Available — click to select |
| 🔴 Red | Booked — click to join waitlist |
| 🟡 Yellow | Buffer — blocked after a booking ends |
| 🟣 Purple | Currently selected by you |

## Concurrency & Correctness

### Double-Booking Prevention (Section 3.1)

This is the core challenge. Two people clicking "Book" at the same millisecond for the same slot must result in exactly one success.

**Problem with naive approach:**

```
Request A:  FIND bookings → no conflict → CREATE booking
Request B:  FIND bookings → no conflict → CREATE booking  (snuck in during A's gap)
Result: Both succeed — double booking!
```

**Our solution: MongoDB Transactions**

```
Request A:  BEGIN TRANSACTION
              FIND bookings (locked snapshot)
              CHECK overlap
              CREATE booking
            COMMIT

Request B:  BEGIN TRANSACTION (waits for A to commit)
              FIND bookings → sees A's booking
              CHECK overlap → conflict detected
            ABORT → 409 error
```

- `createBooking` and `cancelBooking` both run inside `session.withTransaction()`
- The unique compound index `{ roomId, date, startTime }` acts as a safety net
- Buffer time is enforced during the overlap check

### Refund-Window Rule (Section 3.2)

- Computed at cancellation time using the **server clock**
- ≥2 hours before start → `cancelled-refundable`
- <2 hours before start → `cancelled-non-refundable`
- Past bookings cannot be cancelled

### Buffer Time (Section 4.3)

Each room has a configurable buffer (e.g., 10–15 minutes) that blocks the room after a booking ends:

- The availability grid shows buffer slots as yellow/unavailable
- `createBooking` rejects bookings that would start during another booking's buffer
- Enforced at the database level inside the transaction

### Waitlist Auto-Promotion (Section 4.2)

- Users join a waitlist for a fully-booked slot with a position number
- When the booking is cancelled, the first waitlisted person is auto-promoted
- Promotion happens **inside the same transaction** as the cancel — no race condition

## Project Structure

```
roomit/
├── backend/
│   ├── src/
│   │   ├── controller/
│   │   │   ├── booking.controller.js    # Booking CRUD + cancel + waitlist promotion
│   │   │   ├── room.controller.js       # Room CRUD + availability grid
│   │   │   └── waitlist.controller.js   # Waitlist join
│   │   ├── models/
│   │   │   ├── booking.model.js         # Booking schema + unique index
│   │   │   ├── room.model.js            # Room schema (with bufferMins)
│   │   │   └── waitlist.model.js        # Waitlist schema
│   │   ├── routes/
│   │   │   ├── booking.routes.js
│   │   │   ├── room.routes.js
│   │   │   └── waitlist.routes.js
│   │   ├── utils/
│   │   │   ├── apiError.js
│   │   │   ├── apiResponse.js
│   │   │   └── asyncHandler.js
│   │   ├── app.js                       # Express app setup
│   │   └── index.js                     # Server entry point
│   ├── seed.js                          # Database seeder
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── app/
│   │       ├── globals.css              # Custom theme (light mode)
│   │       ├── layout.js                # Root layout with nav
│   │       ├── page.js                  # Home — room cards
│   │       ├── rooms/
│   │       │   └── [id]/page.js         # Room detail — slot grid + booking form
│   │       └── bookings/
│   │           └── page.js              # My Bookings — email lookup + cancel
│   ├── next.config.mjs                  # API proxy rewrites
│   ├── .env
│   └── package.json
└── README.md
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `MONGO_URI` | MongoDB Atlas connection string with `meetingRooms` database |
| `CORS_ORIGIN` | Frontend URL for CORS (default: http://localhost:3000) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: http://localhost:5000) |

## Known Limitations

- **No authentication** — email-based lookup only, no auth middleware
- **Single-slot atomicity** — the unique index on `{ roomId, date, startTime }` catches same-slot conflicts; range overlaps with different startTimes are handled by the transaction's overlap check
- **No email notifications** — waitlist promotion is reflected in the UI only

## License

ISC
