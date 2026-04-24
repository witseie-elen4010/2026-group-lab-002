# KnockKnock.prof

[![CI](https://github.com/witseie-elen4010/2026-group-lab-002/actions/workflows/ci.yml/badge.svg)](https://github.com/witseie-elen4010/2026-group-lab-002/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/witseie-elen4010/2026-group-lab-002/badge.svg?branch=main)](https://coveralls.io/github/witseie-elen4010/2026-group-lab-002?branch=main)

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

## Local database setup

After cloning, set up your local SQLite database with:

```bash
npm run setup
```
This script will 
- Create the database
- Run the schema 
- Seed the initial degrees and courses

This is gitignored — each dev maintains their own local copy.
