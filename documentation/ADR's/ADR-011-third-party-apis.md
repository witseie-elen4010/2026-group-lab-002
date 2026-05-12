# ADR-011: Integrating Third-Party APIs for Weather and Public Holiday Data

**Date:** 2026-05-11
**Status:** Accepted
**Relates to:** ADR-002, ADR-003

---

## Context

Students booking consultations had no visibility into two categories of disruption that directly affect whether an in-person session is practical: public holidays (when lecturers are unavailable) and adverse weather (which affects travel and attendance decisions for students commuting to the Wits Braamfontein campus).

Neither piece of information was previously surfaced anywhere in the application. Students could book a consultation on a public holiday without any warning, and there was no way to know whether the weather on a booking date would make an in-person session inconvenient. Both problems are solvable with read-only data from free external APIs, with no schema changes and no operational overhead.

---

## Decision

Integrate two read-only, zero-cost, no-auth external APIs server-side:

1. **Nager.Date** (`https://date.nager.at/api/v3/PublicHolidays/{year}/ZA`) for South African public holidays.
2. **Open-Meteo** (`https://api.open-meteo.com/v1/forecast?...`) for a 10-day weather forecast at Wits (latitude -26.1892, longitude 28.0306).

Both integrations follow the same architectural pattern:

- All API calls are made **server-side only**, using Node 18's built-in `fetch`. No browser-side requests.
- **Module-level caching**: public holidays are cached for the process lifetime (they do not change mid-year); weather forecasts are cached with a 4-hour TTL (frequent enough to stay fresh, infrequent enough to avoid rate pressure).
- **Silent fallback**: any network error, non-OK response, or JSON parse failure returns an empty safe value (`[]` for holidays, `{}` for weather). The application renders normally without the enrichment data — the feature degrades gracefully rather than breaking the page.
- **No new npm packages**: both integrations use only built-in Node 18 `fetch`.

The data is surfaced as follows:

- **Student dashboard**: weather icons appear in the 10-day calendar column headers with Bootstrap tooltips showing the forecast message and temperature. Public holidays disable the Schedule and Join buttons for that day and replace availability slots with a "Public holiday" badge.
- **Lecturer dashboard**: the monthly calendar table highlights holiday cells in amber with a tooltip showing the holiday name. Weather icons appear inside date cells.
- **Booking page**: the meta line shows the weather icon and temperature for the booking date. If rain or storms are forecast, a contextual info banner prompts the student to consider requesting a Teams link. If temperatures are below 14°C, a warning banner suggests bundling up or going online.

---

## Why These APIs Specifically

**Nager.Date** is free, requires no API key, returns structured JSON with standard `date` (ISO 8601) and `localName` fields, supports South African locale (`/ZA`), and is widely used in open-source projects. It has no rate limits for the request volume a single deployed instance produces.

**Open-Meteo** is free, requires no API key, uses WMO standard weather codes that map cleanly to human-readable conditions, covers Johannesburg coordinates accurately, and is GDPR compliant. The forecast endpoint returns daily summaries (weather code, max temperature) for up to 16 days — exactly the granularity needed to annotate a 10-day booking calendar.

---

## Alternatives Considered and Rejected

**OpenWeatherMap** — requires an API key, which adds a secret-management burden for a shared deployment. The free tier has tight rate limits (60 calls/minute, 1000 calls/day) that could be breached if the module-level cache is not preserved across restarts (e.g., after a Render redeploy). Rejected in favour of Open-Meteo, which is fully free with no key.

**Browser-side API calls** — making the fetch from the student's browser would expose rate limits to client IP addresses, introduce CORS dependency on the API provider's headers, and couple the UI's availability to the API's uptime in a way that would produce visible errors rather than silent degradation. All API calls in this project are server-side (consistent with ADR-002's server-rendered architecture).

**Storing forecast data in SQLite** — would require a new table, a scheduled background job to refresh the data, and logic to handle stale rows. Weather forecasts are inherently ephemeral and always available fresh from the API; caching them in the database adds schema complexity and operational overhead with no benefit over a module-level in-memory cache. Rejected per the existing design philosophy in ADR-003.

**Redis for caching** — introduces a separate service dependency inconsistent with ADR-002 (single Render instance) and ADR-003 (no client-server infrastructure). Module-level cache is sufficient at the project's scale.

---

## Consequences

**Positive:**
- Students and lecturers gain genuine contextual information at booking time — public holidays are visually flagged before a student commits to a slot, and weather context supports an informed choice between in-person and online sessions.
- Zero operational cost: both APIs are free with no keys, no billing accounts, and no infrastructure to manage.
- No new npm dependencies added to the project.
- Silent failure mode means the application is no less reliable than before — if either API is unreachable, the dashboards render exactly as they did prior to this change.
- Satisfies the project brief's criterion (Section 3.1) for "additional functionality which adds value for the end-user and is cohesive with the rest of the application."

**Negative / tradeoffs:**
- Both integrations introduce an external dependency outside the team's control. A long-term outage of either API would silently degrade the feature (no data shown) but would not break the application.
- Weather forecast accuracy is inherently limited to roughly 7 days; forecasts beyond that window are indicative only. Students should treat the weather data as a planning aid, not a guarantee.
- The holidays endpoint URL includes the year (`/2026/ZA`). The application passes `now.getFullYear()` dynamically, so this is not hardcoded — but the Nager.Date dataset only covers years for which data has been published. Dates far in the future may return empty results.
- The Open-Meteo forecast covers only Wits Braamfontein. Students or lecturers consulting from other campuses or remotely will see weather that may not reflect their local conditions.
