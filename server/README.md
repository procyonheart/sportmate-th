# SportMate TH — Backend (Fastify + PostgreSQL)

Replaces the old Google Apps Script + Google Sheets backend
(`tools/apps_script/Code.gs`) with a real API, database, auth, and image storage.

## Setup (local)
```bash
cd server
cp .env.example .env        # fill DATABASE_URL + JWT_SECRET (rest optional in dev)
npm install
npm run migrate             # create tables
npm run dev                 # API on http://localhost:8080
```
With no `RESEND_API_KEY`, verification emails are printed to the console.
With no `CLOUDINARY_URL`, images pass through unchanged (fine for dev).

## Migrate old data from Sheets
1. In Google Sheets: File → Download → CSV for each tab → save as
   `server/sheets_export/Members.csv`, `Activities.csv`, `Joiners.csv`
2. `npm run migrate:sheets`

Old SHA-256 password hashes are kept as `password_algo='sha256'` and are
auto-upgraded to argon2 on each user's next login.

## API (prefix /api)
Public: `GET /getActivities`, `GET /getProfile?username=`,
`POST /signup|login|verifyEmail|resendVerification|submitIdVerify`
Auth (Bearer token): `POST /postActivity|joinActivity|leaveActivity|updateDisplayName|saveProfilePhoto`,
`GET /getNotifications`

## Deploy
Any Node host (Render/Railway/Fly). Set the env vars from `.env.example`,
run `npm run migrate` once, start with `npm start`. Point the frontend's
`assets/api.js` `API_BASE` at the deployed URL.
