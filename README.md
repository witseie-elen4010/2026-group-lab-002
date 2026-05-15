# KnockKnock.prof
[Click here to visit KnockKnock.prof](https://two026-group-lab-002.onrender.com/)

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
