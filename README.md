# CarRento — Car Rental Platform

**Live Demo:** [car-rento-client.vercel.app](https://car-rento-client.vercel.app/)

CarRento is a full-stack MERN car rental application that lets users browse, book, and pay for rental cars online, with a secure OTP-based pickup verification flow and an admin dashboard for managing the fleet and bookings.


## ✨ Features

- **User Authentication** — Secure signup/login using JWT (JSON Web Tokens) and password hashing with bcrypt.
- **Car Listings** — Browse available cars with filters for type, price, and availability.
- **Booking Management** — Users can create, view, and manage their rental bookings.
- **Secure Payments (Escrow)** — Integrated with Razorpay, funds are held in escrow until the rental is confirmed complete.
- **OTP-Based Pickup Verification** — A one-time password is generated and sent to the renter to verify identity at vehicle pickup, preventing fraudulent handovers.
- **Email Notifications** — Automated emails for booking confirmations, OTPs, and status updates.
- **Admin Dashboard** — Admins can manage car inventory, view all bookings, and monitor platform activity.
- **Role-Based Access** — Separate permissions and views for regular users vs. admins.
- **Responsive UI** — Optimized for both desktop and mobile devices.


## 🛠️ Tech Stack

**Frontend**
- React.js
- Tailwind CSS
- Axios (API requests)
- React Router

**Backend**
- Node.js
- Express.js
- MongoDB (Mongoose ODM)

**Authentication & Security**
- JWT (JSON Web Tokens)
- bcrypt (password hashing)

**Payments**
- Razorpay (escrow-based transactions)

**Notifications**
- Nodemailer (email service)

**Deployment**
- Vercel (Frontend)
- Render (Backend)

---

## 📂 Project Structure

```
CarRento/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page-level components
│   │   ├── context/        # Auth/global state context
│   │   ├── utils/          # Helper functions
│   │   └── App.jsx
│   └── package.json
│
├── server/                 # Express backend
│   ├── controllers/        # Route logic
│   ├── models/             # Mongoose schemas (User, Car, Booking)
│   ├── routes/             # API endpoints
│   ├── middleware/         # Auth & error handling middleware
│   ├── utils/              # OTP generation, email service, Razorpay helpers
│   └── server.js
│
└── README.md
```

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- Razorpay account (for payment keys)

### 1. Clone the repository
```bash
git clone https://github.com/Me-Saksh-ire/CarRento.git
cd CarRento
```

### 2. Backend Setup
```bash
cd server
npm install
```

Run the backend server:
```bash
npm start
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

Run the frontend:
```bash
npm run dev
```

---

## 🔑 Core Workflows

### Booking Flow
1. User browses available cars and selects one.
2. User picks rental dates and confirms booking details.
3. Payment is processed via Razorpay and held in **escrow**.
4. Booking confirmation email is sent to the user.

### Pickup Verification Flow
1. On the day of pickup, the system generates a **unique OTP**.
2. OTP is sent to the user's registered email.
3. The renter shares the OTP with staff/admin at pickup.
4. Once verified, the escrowed payment is released and the rental officially begins.

### Admin Flow
1. Admin logs in via a protected admin route.
2. Admin can add/edit/remove cars from inventory.
3. Admin can view and manage all bookings across users.

---

## 🔐 Security Highlights

- Passwords are never stored in plain text — hashed using bcrypt.
- Protected routes use JWT middleware to verify user identity and role.
- Payment funds are held in escrow, reducing risk of fraud on both sides.
- OTP verification adds a second layer of identity confirmation at pickup.

---

## 🚀 Deployment

- **Frontend:** Deployed on [Vercel](https://vercel.com) — live at [car-rento-client.vercel.app](https://car-rento-client.vercel.app/)
- **Backend:** Deployed on Render
- **Database:** MongoDB Atlas (cloud-hosted)

---

## 📌 Future Improvements

- [ ] Add real-time car availability tracking
- [ ] Add reviews and ratings for cars/rental experience
- [ ] Multi-language support
- [ ] Advanced analytics for admin dashboard

---

## 👩‍💻 Author

**Sakshi**
MERN Stack Developer
[Portfolio](https://sakshi-portfolio-sepia.vercel.app)
[GitHub](https://github.com/Me-Saksh-ire)

---
