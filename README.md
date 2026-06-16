# RoomIt — Meeting Room Booking System

An internal meeting room booking platform built with Next.js, Express, and MongoDB. The system supports real-time room availability, waitlist auto-promotion, booking cancellation policies, and transaction-safe booking creation to prevent double-booking.

## 🚀 Live Demo

### Frontend

https://room-meeting-kappa.vercel.app

### Backend

https://roommeeting-sf0j.onrender.com

---

## 📌 Features

### Room Management

* View all available meeting rooms
* Room capacity and buffer-time configuration
* Real-time availability checking

### Booking System

* Create bookings using adjacent 30-minute slots
* Atomic booking creation using MongoDB transactions
* Double-booking prevention
* Booking lookup by email

### Waitlist System

* Join waitlist for fully booked slots
* Automatic promotion when a booking is cancelled
* Promotion occurs inside the same database transaction

### Cancellation Policy

* Refundable cancellation (2+ hours before meeting)
* Non-refundable cancellation (<2 hours before meeting)
* Past bookings cannot be cancelled

### Buffer Time Support

* Configurable room buffer period
* Buffer slots displayed separately in UI
* Enforced during booking validation

---

## 🛠 Tech Stack

| Layer      | Technology                         |
| ---------- | ---------------------------------- |
| Frontend   | Next.js 16, Tailwind CSS |
| Backend    | Node.js, Express 5                 |
| Database   | MongoDB Atlas                      |
| ODM        | Mongoose                           |
| Deployment | Vercel + Render                    |

---

## 📂 Project Structure

```text
roomMeeting/
│
├── frontend/
│   ├── src/
│   │   └── app/
│   ├── next.config.mjs
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controller/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── index.js
│   │
│   ├── seed.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Local Setup

### Clone Repository

```bash
git clone https://github.com/dhannu-dev/roomMeeting.git
cd roomMeeting
```

---

## Backend Setup

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
CORS_ORIGIN=http://localhost:3000
```

Run backend:

```bash
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

---

## Frontend Setup

```bash
cd frontend
npm install
```

Create `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:3000
```

---

## 🌐 API Endpoints

### Rooms

| Method | Endpoint                      |
| ------ | ----------------------------- |
| GET    | /api/v1/room                  |
| GET    | /api/v1/room/:id/availability |

### Bookings

| Method | Endpoint                                                      |
| ------ | ------------------------------------------------------------- |
| POST   | /api/v1/booking                                               |
| GET    | /api/v1/booking?email=[user@email.com](mailto:user@email.com) |
| PATCH  | /api/v1/booking/:id/cancel                                    |

### Waitlist

| Method | Endpoint         |
| ------ | ---------------- |
| POST   | /api/v1/waitlist |

---

## 🔒 Concurrency Protection

The application prevents double-booking using MongoDB transactions.

### Problem

Two users attempting to book the same room at the same time could create duplicate bookings.

### Solution

Each booking operation runs inside a MongoDB transaction:

1. Start transaction
2. Check overlapping bookings
3. Validate buffer constraints
4. Create booking
5. Commit transaction

If another request already booked the slot:

* Transaction aborts
* API returns conflict response

This guarantees booking consistency.

---

## 🔄 Waitlist Auto-Promotion

When a confirmed booking is cancelled:

1. Booking cancellation starts a transaction
2. Waitlist entries are checked
3. First user in queue is promoted
4. Booking is created automatically
5. Transaction commits

This prevents race conditions and ensures fairness.

---

## 💰 Refund Logic

| Condition               | Result                     |
| ----------------------- | -------------------------- |
| 2+ hours before meeting | Cancelled - Refundable     |
| Less than 2 hours       | Cancelled - Non-Refundable |
| Meeting already started | Cancellation blocked       |

---

## 🚀 Deployment

### Frontend

Hosted on Vercel

https://room-meeting-kappa.vercel.app

### Backend

Hosted on Render

https://roommeeting-sf0j.onrender.com

### Database

MongoDB Atlas

---

## 🔮 Future Improvements

* User Authentication (JWT)
* Role-Based Access Control
* Email Notifications
* Calendar Integration
* Admin Dashboard
* Recurring Bookings
* Booking Analytics

---

## 👨‍💻 Author

Dhannu Dev

GitHub:
https://github.com/dhannu-dev

---

## 📄 License

ISC
