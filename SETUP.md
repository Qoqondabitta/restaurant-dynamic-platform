# Luxe Kitchen — Restaurant Platform

Full-stack restaurant platform with an admin dashboard and a public-facing menu.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, Axios |
| Backend | Node.js, Express, Multer (image upload) |
| Database | MongoDB (Mongoose) |

---

## Prerequisites

- **Node.js** v18+ (`node -v`)
- **MongoDB** running locally on port 27017  
  — Install: https://www.mongodb.com/try/download/community  
  — Or use MongoDB Atlas (cloud) — update `MONGO_URI` in `backend/.env`

---

## Setup Instructions

### 1. Clone / open the project

```
cd restaurant-platform
```

### 2. Backend

```bash
cd backend
npm install          # already done if you followed these steps
cp .env.example .env # already created
```

Edit `backend/.env` if needed:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/restaurant
```

**Seed the database with initial menu items:**
```bash
npm run seed
```

**Start the backend:**
```bash
npm run dev          # hot-reload with nodemon
# or
npm start            # production
```

Backend runs at: http://localhost:5000

### 3. Frontend

```bash
cd ../frontend
npm install          # already done
npm run dev
```

Frontend runs at: http://localhost:3000

---

## URLs

| Page | URL |
|------|-----|
| Customer Menu | http://localhost:3000 |
| Admin Dashboard | http://localhost:3000/dashboard |
| API health | http://localhost:5000/health |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/menu` | Fetch all menu items |
| `POST` | `/menu` | Add a new item (multipart/form-data) |
| `PUT` | `/menu/:id` | Update an item |
| `DELETE` | `/menu/:id` | Delete an item |

### POST / PUT body fields

| Field | Type | Notes |
|-------|------|-------|
| `title` | string | Required |
| `price` | number | Required |
| `category` | string | One of: Drinks, Main Dishes, Salads, Soups, Desserts |
| `ingredients` | string | Required |
| `image` | file | Multipart file upload |
| `imageUrl` | string | External image URL (alternative to file upload) |

---

## Features

### Customer Menu (`/`)
- Hero section with animated entrance
- Sticky category navigation with animated underline
- Alternating layout: image slides in from left, text from right
- All items fetched live from the database
- Smooth Framer Motion scroll animations

### Admin Dashboard (`/dashboard`)
- Grid view of all menu items
- Filter bar by category with live counts
- **Add item** — upload image or paste URL, fill in details
- **Edit item** — pre-filled form with current values
- **Delete item** — confirmation popup with item-type-aware message:
  _"Do you really want to delete this meal / drink / salad / soup / dessert?"_
- All changes reflect immediately on the customer menu (no page reload)

---

## Project Structure

```
restaurant-platform/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── seed.js                # Seed 12 initial menu items
│   ├── .env                   # Environment config
│   ├── models/
│   │   └── MenuItem.js        # Mongoose schema
│   ├── routes/
│   │   └── menu.js            # GET/POST/PUT/DELETE /menu
│   ├── middleware/
│   │   └── upload.js          # Multer config (local uploads/)
│   └── uploads/               # Stored image files
│
└── frontend/
    ├── vite.config.js          # Vite + proxy to backend
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── api/menu.js         # Axios API calls
        ├── components/
        │   └── Navbar.jsx
        └── pages/
            ├── CustomerMenu.jsx
            └── Dashboard.jsx
```

---

## Quick Start (all-in-one)

Open **two terminals**:

```bash
# Terminal 1 — Backend
cd restaurant-platform/backend && npm run dev

# Terminal 2 — Frontend
cd restaurant-platform/frontend && npm run dev
```

Then open http://localhost:3000.
