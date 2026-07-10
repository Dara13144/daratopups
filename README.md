# Game Top-Up Website System

A premium, fully functional game top-up website system designed for instant recharge delivery with automated verification.

The project features a **dark-theme, glassmorphism UI** and includes integrated checkout flows for **ABA PayWay (Official signature scheme)** and **Bakong KHQR (EMVCo compliance specifications)**.

---

## 🛠️ Technology Stack

1. **Frontend (`frontend/`)**:
   - Next.js (App Router)
   - React + TypeScript
   - Tailwind CSS v4 (responsive dark mode styling)
   - Lucide React (Icons)
   - Framer Motion (Accents & Micro-animations)
   
2. **Backend (`backend/`)**:
   - Express.js + TypeScript
   - Prisma ORM
   - SQLite Database (zero-setup development, switches to PostgreSQL via `.env`)
   - JWT + Bcrypt Authentication
   - Telegram Webhook Alerts Notifier

---

## 📂 Repository Structure

```
website topup/
├── backend/
│   ├── prisma/             # Schema & Seed configurations (SQLite)
│   ├── src/
│   │   ├── middleware/     # Express auth guards
│   │   ├── routes/         # Auth, Products, Orders, Admin endpoints
│   │   ├── utils/          # Payments & Game Provider Sandbox simulations
│   │   └── index.ts        # Server entry point
│   ├── tsconfig.json
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js Pages (Home, Login, History, Orders, Admin)
│   │   ├── components/     # Header & Footer Layout modules
│   │   └── lib/            # Axios/Fetch API client bindings
│   ├── tsconfig.json
│   └── package.json
├── docker-compose.yml       # Production system composition launcher
└── README.md                # System documentation
```

---

## 🚀 How to Run the Website Locally (Developer Mode)

Follow these steps to spin up the system on your machine:

### 1. Run the Express Backend
Open a terminal in the `backend/` directory:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run dev
```
*This installs dependencies, initializes the local SQLite database, inserts mock products/packages/accounts, and starts the server on **http://localhost:5000**.*

### 2. Run the Next.js Frontend
Open a new terminal in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
*This starts the frontend development server on **http://localhost:3000**.*

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## ⚙️ Testing the Sandbox Payment & Auto-Delivery

The system comes equipped with a **Sandbox Simulator Dashboard** in the checkout view. This allows you to test the complete end-to-end user and admin lifecycle without requiring real bank accounts or API credentials.

### Step-by-Step Test Walkthrough:
1. Open the homepage, click **Login**, and log in using either the User or Admin credentials.
2. Select a game (e.g., **Free Fire** or **Mobile Legends**).
3. Enter a Player ID (e.g., `12345678` for Free Fire or `998877` / Zone `1234` for Mobile Legends) and click **Verify Player Nickname** to retrieve their mock nickname.
4. Select a diamond package, choose your payment method (**Bakong KHQR** or **ABA PayWay**), and click **Purchase Top Up**.
5. You will be redirected to the secure invoice checkout screen where a mock KHQR code or ABA details card is shown.
6. Underneath the QR, click the **Simulate Successful Payment** button.
7. **What happens under the hood:**
   - A mock webhook hits `/api/orders/simulate-callback` in the backend.
   - The backend changes the payment status to `PAID`.
   - The game provider simulator executes the top-up or delivers a digital voucher code from stock.
   - A Telegram notification is triggered (logged to the console output of the backend terminal for dev mode).
   - The frontend checkout page (polling every 3 seconds) automatically transitions to the **Success Screen**, displaying the delivered stock code or recipient confirmation details.
8. Log in as **admin@topup.com** to view dashboard revenues, manual verification buttons, and stock card uploads!

### 🔑 Default Sandbox Accounts:
- **Administrator**: `admin@topup.com` / password: `admin123`
- **Standard User**: `user@topup.com` / password: `user123`

---

## 🐳 Running with Docker

You can run both the frontend and backend with a single command:
```bash
docker-compose up --build
```
Once built and running:
- Frontend will be available at: `http://localhost:3000`
- Backend will be available at: `http://localhost:5000`

---

## 🔒 Switching to Production

To move the system to production with real credentials:
1. Update `backend/.env`:
   - Change `SANDBOX_MODE` to `false`.
   - Update `DATABASE_URL` to point to your live PostgreSQL/Supabase database.
   - Run `npx prisma db push` to push the schema to the Postgres database.
   - Replace the `ABA_PAYWAY_MERCHANT_ID`, `ABA_PAYWAY_API_KEY`, and `BAKONG_TOKEN` with your real bank merchant details.
   - Update `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to send notifications to your real Telegram Channel/Group.
2. In `backend/src/utils/gameProviderMock.ts`, connect the lookup and delivery methods to your official provider endpoints (like Codashop API, UniPin, or SEAGM Partner APIs).
