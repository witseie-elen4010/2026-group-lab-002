# KnockKnock.prof
[Click here to visit KnockKnock.prof](https://two026-group-lab-002-vsoh.onrender.com)

[![CI](https://github.com/witseie-elen4010/2026-group-lab-002/actions/workflows/ci.yml/badge.svg)](https://github.com/witseie-elen4010/2026-group-lab-002/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/witseie-elen4010/2026-group-lab-002/badge.svg?branch=main&kill_cache=1)](https://coveralls.io/github/witseie-elen4010/2026-group-lab-002?branch=main)
[![Uptime Robot status](https://img.shields.io/uptimerobot/status/m803068038-afc6aea04353fb997c39efc4?up_message=online)](https://stats.uptimerobot.com/7eLhP71yAn)





> Knock knock. Who's there? Your 2pm consultation group.

A web application for scheduling group consultations between students and lecturers.

**Group members:** 
- Suné Toerien
- Aditya Raghunandan
- Thandeka Malasa

## Running Tests

Install dependencies:
```bash
npm install
```

Run the test suite:
```bash
npm test
```
## Running E2E Tests

First make sure the database is set up:

```bash
npm run setup
```

Then run the Playwright smoke test:

```bash
npm run test:e2e
```

E2E tests launch a real Chromium browser against a local instance of the app.
They run automatically in CI on every pull request via GitHub Actions.

## Local database setup

After cloning, set up your local SQLite database with:

```bash
npm run setup
```

To run locally
```bash
node app.js
```

This script will 
- Create the database
- Run the schema 
- Seed the initial degrees and courses

This is gitignored — each dev maintains their own local copy.

## Email setup (local development)

Emails (verification codes, login PINs, password resets) are sent via Gmail SMTP. To enable them locally, create a `.env` file in the project root:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM="KnockKnock.prof" <your.email@gmail.com>
APP_URL=http://localhost:3000
```

**Getting a Gmail App Password:**

Google does not allow regular passwords for SMTP. You need a 16-character App Password:

1. Make sure your Google account has 2-Step Verification enabled
2. Go to **Google Account → Security → App Passwords**
3. Click **Create**, give it any name (e.g. "KnockKnock local")
4. Copy the 16-character password shown and paste it as `SMTP_PASS` — no spaces

Without a `.env` file the app still runs, but any action that triggers an email will log an error and silently continue.
