# RoomIt — 2-Day Execution Plan (MERN Stack)

## Architecture

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Database    | MongoDB (Atlas or local)          |
| ODM         | Mongoose                          |
| Backend API | Express.js (separate server)      |
| Frontend    | Next.js 14+ (App Router)          |

---

## MongoDB Schema

```javascript
// models/Room.js
const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  capacity: { type: Number, required: true },
  bufferMins: { type: Number, default: 10 }
})

// models/Booking.js
const bookingSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  bookedBy: { type: String, required: true },
  email: { type: String, required: true, index: true },
  title: { type: String, required: true },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled-refundable', 'cancelled-non-refundable'],
    default: 'confirmed'
  },
  version: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
})

// THE KEY: Compound unique index prevents double-booking
bookingSchema.index({ roomId: 1, date: 1, startTime: 1 }, { unique: true })

// models/Waitlist.js
const waitlistSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  email: { type: String, required: true },
  name: { type: String, required: true },
  position: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
})

waitlistSchema.index({ roomId: 1, date: 1, startTime: 1, email: 1 }, { unique: true })
```

---

## Extended Requirements Pick

Implement **4.2 (Waitlist)** and **4.3 (Buffer Time)** — independent, moderate complexity, demonstrate concurrency understanding.

---

## Day 1: Backend (8-10 hours)

### Phase 1: Project Setup (1 hour)

```
roomit/
├── server/              # Express backend
│   ├── config/
│   │   └── db.js
│   ├── models/
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   └── Waitlist.js
│   ├── routes/
│   │   ├── rooms.js
│   │   ├── bookings.js
│   │   └── waitlist.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── seed.js
│   ├── server.js
│   └── package.json
├── client/              # Next.js frontend
│   └── ...
├── .env
└── README.md
```

```bash
# Backend setup
mkdir server && cd server
npm init -y
npm install express mongoose cors dotenv
npm install -D nodemon

# Frontend setup
npx create-next-app@latest client --typescript --app
```

### Phase 2: MongoDB Connection + Seed (1 hour)

**server/config/db.js**

```javascript
const mongoose = require('mongoose')

const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI)
  console.log(`MongoDB connected: ${conn.connection.host}`)
}

module.exports = connectDB
```

**server/seed.js** — Create 4 rooms + 15 bookings, some within 2 hours.

### Phase 3: API Routes (4-5 hours)

| Route                    | Method | Key Logic                                        |
|--------------------------|--------|--------------------------------------------------|
| `/api/rooms`             | GET    | Simple find()                                    |
| `/api/rooms/:id/availability` | GET | Generate 30-min slots, query bookings, apply buffer |
| `/api/bookings`          | GET    | Filter by email query param                       |
| `/api/bookings`          | POST   | Transaction: try insert, catch dup key → 409     |
| `/api/bookings/:id/cancel` | PATCH | Server clock check, update status, promote waitlist |

**Booking creation — the critical endpoint:**

```javascript
// POST /api/bookings
router.post('/', async (req, res) => {
  const { roomId, date, slots, bookedBy, email, title } = req.body

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    for (const slot of slots) {
      const existing = await Booking.findOne({
        roomId,
        date: new Date(date),
        startTime: slot.startTime,
        status: 'confirmed'
      }).session(session)

      if (existing) {
        throw new Error('CONFLICT')
      }

      await Booking.create([{
        roomId,
        date: new Date(date),
        startTime: slot.startTime,
        endTime: slot.endTime,
        bookedBy,
        email,
        title,
        status: 'confirmed'
      }], { session })
    }

    await session.commitTransaction()
    res.status(201).json({ message: 'Booking confirmed' })

  } catch (error) {
    await session.abortTransaction()
    if (error.message === 'CONFLICT') {
      return res.status(409).json({
        message: 'One or more slots are no longer available'
      })
    }
    res.status(500).json({ message: 'Server error' })
  } finally {
    session.endSession()
  }
})
```

**Availability endpoint:**

```javascript
// GET /api/rooms/:id/availability?date=2026-06-14
router.get('/:id/availability', async (req, res) => {
  const { id } = req.params
  const { date } = req.query

  const room = await Room.findById(id)
  const startOfDay = new Date(date)
  const endOfDay = new Date(date)
  endOfDay.setDate(endOfDay.getDate() + 1)

  const bookings = await Booking.find({
    roomId: id,
    date: { $gte: startOfDay, $lt: endOfDay },
    status: 'confirmed'
  })

  const slots = []
  for (let hour = 8; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}`

      const isBooked = bookings.some(b => b.startTime === timeStr)
      const isBuffer = !isBooked && isWithinBuffer(timeStr, bookings, room.bufferMins)

      slots.push({
        time: timeStr,
        available: !isBooked && !isBuffer,
        status: isBooked ? 'booked' : isBuffer ? 'buffer' : 'available'
      })
    }
  }

  res.json({ room, date, slots })
})

function isWithinBuffer(timeStr, bookings, bufferMins) {
  for (const booking of bookings) {
    const bookingEnd = timeToMinutes(booking.endTime)
    const slotStart = timeToMinutes(timeStr)
    const bufferEnd = bookingEnd + bufferMins

    if (slotStart >= bookingEnd && slotStart < bufferEnd) {
      return true
    }
  }
  return false
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  return h * 60 + m
}
```

**Cancel endpoint:**

```javascript
// PATCH /api/bookings/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  const booking = await Booking.findById(req.params.id)

  if (!booking) return res.status(404).json({ message: 'Not found' })
  if (booking.status !== 'confirmed') {
    return res.status(400).json({ message: 'Booking already cancelled' })
  }

  const now = new Date()
  const bookingStart = new Date(booking.date)
  const [h, m] = booking.startTime.split(':').map(Number)
  bookingStart.setUTCHours(h, m, 0, 0)

  const hoursUntilStart = (bookingStart - now) / (1000 * 60 * 60)

  const newStatus = hoursUntilStart >= 2
    ? 'cancelled-refundable'
    : 'cancelled-non-refundable'

  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await Booking.findByIdAndUpdate(req.params.id,
      { status: newStatus },
      { session }
    )

    // Auto-promote from waitlist (4.2)
    const waitlisted = await Waitlist.findOne({
      roomId: booking.roomId,
      date: booking.date,
      startTime: booking.startTime
    }).sort({ position: 1 }).session(session)

    if (waitlisted) {
      await Booking.create([{
        roomId: booking.roomId,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        bookedBy: waitlisted.name,
        email: waitlisted.email,
        title: 'Waitlist Promotion',
        status: 'confirmed'
      }], { session })

      await Waitlist.findByIdAndDelete(waitlisted._id, { session })
    }

    await session.commitTransaction()
    res.json({ message: 'Booking cancelled', status: newStatus })

  } catch (error) {
    await session.abortTransaction()
    res.status(500).json({ message: 'Server error' })
  } finally {
    session.endSession()
  }
})
```

### Phase 4: Concurrency Testing (2 hours)

```bash
#!/bin/bash
# concurrent-test.sh

echo "Firing 10 simultaneous booking requests for the same slot..."
for i in $(seq 1 10); do
  curl -s -o "result_$i.json" -w "Request $i: HTTP %{http_code}\n" \
    -X POST http://localhost:5000/api/bookings \
    -H "Content-Type: application/json" \
    -d "{
      \"roomId\": \"ROOM_ID_HERE\",
      \"date\": \"2026-06-14\",
      \"slots\": [{\"startTime\": \"09:00\", \"endTime\": \"09:30\"}],
      \"bookedBy\": \"User $i\",
      \"email\": \"user${i}@test.com\",
      \"title\": \"Meeting $i\"
    }" &
done
wait

echo "---"
echo "Results:"
for i in $(seq 1 10); do
  echo -n "Request $i: "
  cat "result_$i.json" | grep -o '"message":"[^"]*"'
done
```

Expected: Exactly one 201, nine 409s.

---

## Day 2: Frontend + Polish (8-10 hours)

### Phase 5: Frontend Pages (5-6 hours)

**/rooms — Room List**
- Simple card grid showing rooms
- Link to /rooms/[id]

**/rooms/[id] — Booking Grid**
- Date picker (default today)
- 30-min slot grid from 08:00-20:00
- Available = green, Booked = red, Buffer = yellow
- Click available slots to select consecutive ones
- Booking form (name, email, title)
- Submit → optimistic update, rollback on 409

**/bookings — My Bookings**
- Email input → fetch bookings
- Show status with color coding
- Cancel button with confirmation modal
- Disabled for past/cancelled bookings

**next.config.js — Proxy to backend:**

```javascript
module.exports = {
  async rewrites() {
    return [
      { source: '/api/:path*', destination: 'http://localhost:5000/api/:path*' }
    ]
  }
}
```

### Phase 6: Extended Features (2-3 hours)

**4.3 Buffer Time:**
- Room model has bufferMins field
- Availability endpoint checks if slot is within buffer of any booking
- Buffer slots shown as unavailable in UI

**4.2 Waitlist:**
- When slot is full, show "Join Waitlist" button
- Waitlist position displayed
- On cancel, auto-promote updates status

### Phase 7: Seed Data + README (1 hour)

Seed script creates:
- 4 rooms with different capacities and buffer times
- 10-15 bookings across different times/dates
- Some bookings starting within 2 hours (for refund testing)
- A couple fully-booked slots (for waitlist testing)

---

## Risk Mitigation

| Risk                                  | Mitigation                                              |
|---------------------------------------|---------------------------------------------------------|
| Transaction requires replica set      | Use Atlas free tier or mongod --replSet                  |
| Timezone storage issues               | Store as UTC, convert in display only                   |
| Buffer calculation edge cases         | Test with bookings ending at 19:30, 19:00, etc.         |
| Multi-slot partial conflict           | Transaction aborts entirely, no partial bookings        |

---

## Testing Checklist

- [ ] Two simultaneous bookings for same slot → one 200, one 409
- [ ] Multi-slot booking where one slot conflicts → entire booking fails
- [ ] Cancel >= 2 hours before → refundable status
- [ ] Cancel < 2 hours before → non-refundable status
- [ ] Cancel immediately frees slot for new booking
- [ ] Buffer time blocks adjacent slots
- [ ] Waitlist promotes on cancel
- [ ] Availability grid matches actual bookings
