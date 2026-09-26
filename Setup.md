# Hire A Hand — Demo Setup Guide

A working demo of an **on-demand skilled worker hiring app** (hourly, daily, or emergency).

- **Mobile app:** React Native (Expo Go), one app with two roles: Customer and Worker
- **Backend:** Django + Django REST Framework + SQLite (no database install needed)

```
hire-demo/
├── Setup.md          <- this file
├── backend/          <- Django API
└── mobile/           <- App.js + src/ (copied into an Expo project, see Part 2)
```

## What the demo shows

| Area | Included in demo |
|---|---|
| Mobile-number login with OTP | Yes (demo OTP is always `123456`) |
| Worker categories (Electrician, Plumber, Carpenter, AC Tech, Painter, Mason, Helper, Driver, Cleaner) | Yes |
| Customer: browse workers by category, see rating, rate, simulated ETA | Yes |
| Booking types: hourly, daily, multi-day, emergency | Yes |
| "Book now" or "schedule for later", repeat-daily toggle | Yes ("repeat daily" is recorded but only the first visit runs in this demo) |
| Auto price calculation from the worker's hourly/daily rate | Yes |
| Payment method selection (cash, Mada, Apple Pay, card, wallet) | Yes, simulated — no real charge |
| Worker: accept/decline requests, check-in/check-out, mark job complete | Yes |
| Ratings & reviews after job completion | Yes |
| Worker earnings and job timesheet | Yes |
| Django admin panel | Yes, at `/admin/` |

Not in the demo (planned for the full product): real SMS OTP, live GPS tracking on a map, in-app chat/call, real payments, WhatsApp/IVR booking, subscription packages, multi-language UI, background checks.

---

## Prerequisites

- **Python 3.10+** (check: `python --version` or `python3 --version`)
- **Node.js 18+ LTS** (check: `node --version`)
- **Expo Go** app on your phone (App Store / Google Play)
- Your phone and computer on the **same Wi-Fi network**

---

## Part 1 — Backend (Django)

Open a terminal in the `backend` folder.

**1. Create a virtual environment**

Mac / Linux:
```bash
python3 -m venv venv
source venv/bin/activate
```
Windows (PowerShell):
```powershell
python -m venv venv
venv\Scripts\activate
```

**2. Install dependencies**
```bash
pip install -r requirements.txt
```

**3. Create the database and load demo data**
```bash
python manage.py makemigrations core
python manage.py migrate
python manage.py seed
```
The seed command creates 2 customers, 6 workers across several categories, and a few sample bookings.

**4. Start the server so your phone can reach it**
```bash
python manage.py runserver 0.0.0.0:8000
```
Keep this terminal open. Test it: open `http://localhost:8000/admin/` in your browser (you should see the Django admin login).

Optional, to browse data in the admin panel: `python manage.py createsuperuser`.

---

## Part 2 — Mobile app (Expo Go)

**1. Find your computer's local IP address**

- Windows: run `ipconfig`, look for "IPv4 Address" (e.g. `192.168.1.25`)
- Mac: run `ipconfig getifaddr en0`
- Linux: run `hostname -I`

**2. Create a fresh Expo project** (this guarantees the version matches the current Expo Go app)
```bash
npx create-expo-app@latest hire-mobile --template blank
cd hire-mobile
```

**3. Copy the demo code in**

Copy `App.js` and the whole `src` folder from this package's `mobile/` folder into `hire-mobile/`, **replacing the existing `App.js`**.

**4. Install the one extra dependency**
```bash
npx expo install @react-native-async-storage/async-storage
```

**5. Set the API address**

Open `src/config.js` and replace `YOUR_COMPUTER_IP` with the IP from step 1:
```js
export const API_URL = 'http://192.168.1.25:8000/api';
```

**6. Start Expo**
```bash
npx expo start
```
Scan the QR code with your phone (Android: inside Expo Go; iPhone: with the Camera app, which opens Expo Go).

---

## Demo walkthrough (about 5 minutes)

Demo accounts (OTP is always `123456`):

| Role | Mobile number |
|---|---|
| Customer (Faisal Al-Otaibi) | `0511111111` |
| Worker (Imran Sheikh, electrician) | `0522222221` |

The login screen also has **Quick demo login** buttons.

1. **Customer:** log in as Customer. On Home, tap **Electrician**. See two workers ranked by availability/rating with a simulated ETA.
2. Tap **Book** on an available worker. Choose booking type (try **hourly**, 2 hours), "Book now", pick a payment method, and confirm. Watch the price calculate live.
3. **Worker:** log out, log in as Worker (`0522222221`). Open **Requests**, see the incoming booking, and tap **Accept**.
4. Go to the **Jobs** tab: tap **Check in & start job**, then **Check out & complete job**.
5. **Customer:** log back in. On the **Bookings** tab, the job now shows Completed. Tap **Rate this job**, pick stars, add a review, submit.
6. **Worker:** log back in and open **Earnings** — the completed job, its price, and your new rating average appear.
7. Try an **emergency** booking (1.5× rate, 2-hour minimum) or a **daily** booking to see the different pricing.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| "Cannot reach the server" on the phone | Check `API_URL` in `src/config.js`. Do not use `localhost` or `127.0.0.1` (that refers to the phone itself). |
| Still cannot connect | Confirm the backend runs with `0.0.0.0:8000`, phone and PC are on the same Wi-Fi, and your firewall allows port 8000 (Windows: allow Python through Windows Defender Firewall). Test by opening `http://YOUR_IP:8000/admin/` in your phone's browser. |
| Expo Go cannot load the project | Try `npx expo start --tunnel`. Corporate or guest Wi-Fi often blocks local connections. |
| `No module named rest_framework` | The virtual environment is not active. Activate it and run `pip install -r requirements.txt` again. |
| `no such table` errors | Run `python manage.py makemigrations core` and `python manage.py migrate`. |
| Want a clean start | Delete `backend/db.sqlite3` and repeat Part 1, step 3. |
| SDK version mismatch in Expo Go | Always create the project with `create-expo-app@latest`, as in Part 2, step 2. |
| "Book" button greyed out | The worker is marked unavailable. Log in as that worker and toggle "Available for new jobs" On in their Profile tab. |

---

## API reference (for developers)

All endpoints are under `/api`. Authenticated calls send `Authorization: Token <token>`.

| Method | Endpoint | Who | Purpose |
|---|---|---|---|
| POST | `/auth/login` | Anyone | Phone + OTP login, creates the account on first use |
| GET / PUT | `/me` | Any | View or update profile |
| GET | `/stats` | Any | Dashboard counts (earnings for workers, booking counts for customers) |
| GET | `/categories` | Anyone | List of worker categories |
| GET | `/workers?category=` | Customer | Workers in a category, sorted by availability then rating |
| GET / POST | `/bookings` | Any / Customer | List own bookings / create a booking with a chosen worker |
| PATCH | `/bookings/<id>` | Worker or customer | Worker: accept, reject, check-in (in_progress), check-out (completed). Customer: cancel |
| POST | `/bookings/<id>/rate` | Customer | Rate a completed booking 1–5 and leave a review |

Price calculation: hourly = hours × hourly_rate; daily/multi-day = days × daily_rate; emergency = max(hours, 2) × hourly_rate × 1.5. See `compute_price()` in `backend/core/models.py`.

---

## Next steps toward the full product

1. Real OTP via an SMS provider, and National ID/Iqama verification
2. Live GPS tracking with Google Maps, real ETA and route
3. In-app chat and masked voice calls
4. Real payments (HyperPay, STC Pay, Apple Pay, Mada)
5. WhatsApp and IVR phone booking for users without smartphones
6. Subscription packages and true recurring "repeat daily" auto-booking
7. Multi-language UI (Arabic, English, Urdu, Hindi, Bengali, Filipino) with RTL support
8. Admin dashboard for worker onboarding, verification, and dispute resolution
9. Move from SQLite to PostgreSQL and deploy the API behind HTTPS
