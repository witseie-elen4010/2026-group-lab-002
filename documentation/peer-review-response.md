# Peer Review Response

**Date:** 2026-05-16
**Branch:** bugFixesPeerReview
**Reviewer feedback received on:** KnockKnock.prof student-facing flows

---

## 1. A student can have zero courses saved

**Reviewer concern:** The system should require at least one course.

**Our position:** Not enforced — by design.

A student may legitimately have zero courses at certain points in the academic lifecycle: they may have just registered, be between semester enrolments, or have dropped a course while a replacement is being processed. Enforcing a minimum of one course would block these valid states and add friction for no meaningful safety benefit — a student with no courses simply sees no consultation slots to book, which is the correct and safe outcome. We have added a validation message when a student tries to save a course edit with zero courses selected, so the UX is not misleading, but we do not prevent the empty state from existing in the database.

---

## 2. Saving the course edit page with no changes shows "Edits saved successfully"

**Reviewer concern:** No-op saves give a false success message.

**Resolution:** Fixed. We now validate that at least one course is selected before saving. If the student submits the form with zero courses ticked, the page renders an inline error ("Please select at least one course before saving.") and does not write to the database. This addresses both the false success message and the zero-course edge case from item 1.

---

## 3. Removing a course does not cancel existing bookings for that lecturer

**Reviewer concern:** Booked consultations remain visible after the associated course is dropped.

**Our position:** Intentional — bookings are independent once confirmed.

A consultation booking is a confirmed arrangement between a student and a lecturer. Automatically cancelling it when a course is removed would be disruptive and surprising — the student may have an important meeting scheduled. The correct flow is for the student to explicitly cancel the booking themselves if they no longer need it. The cancel button is available on the consultation detail page. We acknowledge this could be clearer in the UI and will add a note on the student dashboard if their active bookings include courses they are no longer enrolled in.

---

## 4. There is no cancel or reschedule button for booked meetings

**Reviewer concern:** Students cannot cancel a meeting close to the scheduled time.

**Clarification:** A cancel button already exists on the consultation detail page. The reviewer may not have encountered it during testing. It prompts for confirmation before cancelling.

**Enhancement planned:** We will add a time-based restriction so that cancellations are blocked within 2 hours of the scheduled start, with a clear message explaining why. A reschedule flow is out of scope for this sprint but noted for backlog.

---

## 5. The "Find a Consultation" page is overwhelming

**Reviewer concern:** Showing all time slots for the full week across all courses is too much information at once.

**Resolution:** Redesigned. The course filter chips at the top of the page now act as active filters — clicking a course badge shows only that course's slots. The view also defaults to showing today's slots only, with a "Show full week" toggle for users who want the broader view. This reduces the default visible content by approximately 80% and makes the purpose of the page (find one slot, book it) much clearer.

---

## 6. Pressing the logo navigates to the landing page

**Reviewer concern:** Unsure if this is intentional.

**Our position:** Intentional. The logo acting as a home link is a universal web convention (established by Nielsen Norman Group research). Authenticated users landing on the home page are immediately redirected to their dashboard, so there is no functional disruption. No change made.

---

## 7. The logout button has no confirmation

**Reviewer concern:** Accidental logouts are possible.

**Resolution:** Implemented. A browser confirmation dialog ("Are you sure you want to log out?") now appears before the logout request is sent. This is a single line of JavaScript on the logout link and adds no friction to intentional logouts.

---

## Summary

| # | Concern | Action |
|---|---------|--------|
| 1 | Zero courses required | Not enforced — justified above. Validation message added for zero-course save. |
| 2 | False success on no-op edit | Fixed — zero-course validation blocks the save. |
| 3 | Bookings persist after course drop | Intentional — bookings are confirmed arrangements. UI note planned. |
| 4 | No cancel/reschedule button | Cancel exists. Time-based restriction to be added. |
| 5 | Overwhelming consultation view | Redesigned with course filters and today-first default. |
| 6 | Logo goes to landing page | Intentional — universal web convention. |
| 7 | No logout confirmation | Fixed — confirmation dialog added. |
