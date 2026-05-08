# Testing Guide

This document defines the minimum testing standards for the KnockKnock.prof
project. It supplements the coding style guide and code review guide and is
enforced during pull request review.

We use **Jest** as our primary testing framework (per the ELEN4010 brief and
Lab 4). End-to-end browser testing will be introduced in the final sprint —
see the "E2E testing" section at the bottom.

---

## 1. What to test

Every pull request that adds or changes logic must ship with tests. A reviewer
may block a PR for missing tests.

**Must have tests:**
- Any function in `src/` that contains branching logic, calculations, or data
  transformations (e.g., booking validation, overlap detection, availability
  matching).
- Every Express route handler — at minimum one happy-path test and one
  failure-path test.
- Every bug fix — add a regression test that would have caught the bug before
  you fix the bug itself.

**May skip tests:**
- Pure configuration files.
- Thin glue code with no logic (e.g., a route that only calls a controller
  and returns its result — test the controller instead).
- View templates / static HTML.

**Acceptance tests per story (required by brief §4.4):**
Every user story and developer-sized story issue must list its acceptance
tests in the issue body, using this format:

```
## Acceptance Tests
- [ ] Given a lecturer with no availability, when a student tries to book,
      then the booking is rejected with error "Lecturer not available".
- [ ] Given a consultation at max capacity, when a student tries to join,
      then the join button is disabled.
```

Automate these where possible. If a test can't be automated (e.g., visual
polish), explain why in the PR description.

---

## 2. How to write a Jest test

### File location and naming
- Unit tests live next to the code they test: `src/services/booking.js` →
  `src/services/booking.test.js`.
- Integration tests go in `tests/integration/`.

### Test structure: Arrange, Act, Assert
Every test has three clear sections. Don't mix them.

```javascript
/* eslint-env jest */
const { canBook } = require('./booking')

describe('canBook()', () => {
  test('rejects booking outside lecturer availability window', () => {
    // Arrange
    const lecturer = { availability: [{ day: 'Mon', start: '09:00', end: '11:00' }] }
    const requestedSlot = { day: 'Mon', start: '14:00', end: '14:30' }

    // Act
    const result = canBook(lecturer, requestedSlot)

    // Assert
    expect(result).toEqual({ allowed: false, reason: 'outside_availability' })
  })
})
```

### Test naming
Use the pattern: **"does X when Y"** or **"rejects/returns/throws X when Y"**.
A failing test's name alone should tell you what broke.

- ❌ Bad: `test('booking test', ...)`
- ❌ Bad: `test('works correctly', ...)`
- ✅ Good: `test('rejects booking outside lecturer availability window', ...)`
- ✅ Good: `test('returns empty list when student has no upcoming consultations', ...)`

### One logical assertion per test
Multiple `expect()` calls are fine *if* they check the same behaviour. Don't
bundle unrelated checks into one test — when it fails you can't tell which
part broke.

---

## 3. Isolation rules

Tests must not depend on each other. Every test must pass when run alone and
when the suite is run in any order.

- **Reset shared state between tests** using `beforeEach()` / `afterEach()`.
  This matters a lot for the `classList` module and anything using
  module-level variables.
- **Never hit the real database** in unit tests. Mock it or use an in-memory
  fake. Integration tests may use a dedicated test database that is wiped
  between runs.
- **Never call real third-party APIs** in any automated test. Mock them.
  (See brief: we may use RapidAPI later — mock those responses in Jest.)
- **Don't rely on test execution order.** Jest shuffles by default in some
  configs. Assume order is random.

---

## 4. Coverage targets

We measure coverage with `jest --coverage` and publish the report to
Coveralls via GitHub Actions.

| Sprint | Target line coverage of `src/` |
|--------|-------------------------------|
| 1      | ≥ 40% (foundation)            |
| 2      | ≥ 60%                         |
| 3      | ≥ 70%                         |
| 4      | ≥ 75%                         |

Coverage is a floor, not a ceiling. 100% coverage with trivial assertions is
worse than 70% coverage with meaningful ones. Reviewers should reject tests
that only exist to hit coverage numbers (e.g., `expect(result).toBeDefined()`
on a function that returns an object).

---

## 5. Handling test failures in CI

If the test suite fails on `main` it must be fixed within 24 hours. A broken
trunk blocks everyone.

### Flaky tests policy
A "flaky test" is a test that sometimes passes and sometimes fails without
any code change. Flaky tests erode trust in the whole suite.

Our policy (adapted from common industry practice, stricter than Google's):

1. **First failure on CI: the test is treated as a real failure.** The author
   investigates before retrying. We do not auto-retry in CI by default.
2. **If investigation shows the test is genuinely flaky** (e.g., timing
   issue, network dependency, shared state leak):
   - Open a `bug` issue labelled `flaky-test` in the repo.
   - Mark the test with `test.skip()` and a TODO referencing the issue
     number. Do not leave it silently failing.
   - The issue must be resolved within the next sprint. No test stays
     skipped for more than one sprint.
3. **Never add `jest.retryTimes()` or similar retry logic to hide flakiness.**
   Retries mask the root cause (usually a race condition or shared state) and
   those bugs will eventually bite in production.

The instinct to auto-retry failing tests 3× is common (Google does a version
of this at massive scale), but at our scale the benefit is not worth the cost
of hiding real bugs. If we later find we have enough stable tests that
genuine infra-level flakiness (network blips on Azure, etc.) becomes the main
noise source, we can revisit this policy.

---

## 6. What reviewers check

When reviewing a PR, the reviewer verifies:

- [ ] New/changed logic has tests.
- [ ] Test names describe behaviour, not implementation.
- [ ] Tests would fail if the logic were broken (try mentally deleting the
      implementation — would the test still pass? If yes, the test is weak).
- [ ] No test depends on another test's side effects.
- [ ] No real external services (DB, HTTP APIs) are called from unit tests.
- [ ] Acceptance tests listed in the issue are all covered.
- [ ] Coverage hasn't dropped significantly (check the Coveralls comment on
      the PR).

---

## 7. E2E testing (Sprint 3+)

End-to-end tests exercise the running app through a real browser. The rubric
rewards these at "Excellent" level: *"End-to-end tests are automated by the
end of the final sprint."*

Tool decision deferred to a later ADR — likely candidates are Playwright or
Cypress. When we introduce E2E tests, we will adopt these principles (adapted
from the Playwright team's public guidance):

1. **Cover critical user workflows only**, not every feature. For us that
   means: login, create consultation, join consultation, cancel consultation,
   lecturer sets availability. Not every minor UI tweak.
2. **Use stable selectors.** Add `data-testid` attributes to key elements
   rather than relying on CSS class names or text content that may change.
3. **Each E2E test is independent.** Use a fresh database seed per test. No
   test should depend on another test having run first.
4. **Assert from the user's perspective.** "User sees confirmation message"
   is better than "hidden flag in state is set to true".
5. **Mock external services**, not the app itself. We want to test *our*
   code, not RapidAPI's.

## 7. Update from ADR-009

Framework: **Playwright**  
Location: `tests/e2e/`  
Run locally: `npm run test:e2e`  
Run in CI: automatic on every PR via the `e2e` job in `.github/workflows/ci.yml`

E2E tests launch the full app (`node app.js`) against a local SQLite database. Run `npm run setup` first if you haven't already.


### Browser coverage
All E2E tests run against Chromium only. We explicitly chose not to run
tests against Firefox, WebKit, or mobile browsers for these reasons:

- Bootstrap 5 handles the bulk of cross-browser layout differences for us.
- Multi-browser CI runs would roughly triple E2E runtime on every PR,
  which hurts developer feedback loop more than it helps.
- Our user base (Wits students) is concentrated on Chromium-based browsers.
- The course rubric rewards E2E tests being automated; it does not
  require a browser matrix.

Before the final release (Sprint 4), one team member performs a manual
smoke test of critical workflows in Firefox and Edge. Any issues found
become bugs in the next sprint or are documented as known limitations
in the final retrospective.

---

## 8. Quick checklist before opening a PR

```
[ ] `npm test` passes locally
[ ] `npm run lint` passes locally
[ ] New logic has at least one happy-path test and one failure-path test
[ ] Acceptance tests from the issue are covered
[ ] Coverage has not dropped below the sprint target
[ ] No test hits a real external service
[ ] Commit messages follow the Angular convention
```
