# Sprint 4 Retrospective Meeting Minutes

**Project:** KnockKnock.prof Consultation Scheduler  
**Course:** Software Development III (ELEN4010)  
**Institution:** University of the Witwatersrand, Johannesburg  
**Date:** 19 May 2026  

## Attendees

- Suné Toerien (Sarcastic Sunflower)
- Aditya Raghunandan (Aditya-Raghunandan)
- Thandeka Malasa (ThandiAlgorithm)

## 1. Sprint Velocity Calculation

**Achieved Velocity:** 58 Story Points

The team completed 58 story points in Sprint 4, down from the 74 story points achieved in Sprint 3. This was expected and intentional. Sprint 4 was the final sprint of the project, and the team made a deliberate decision to focus on system quality, security, and stability rather than feature volume. The team delivered a comprehensive security hardening programme, completed several stories that had been deferred from earlier sprints, and responded to the peer review. The project has now been submitted. Across all four sprints, the team delivered a fully functional consultation scheduling platform from the ground up, accumulating a total of 222 story points: 39 in Sprint 1, 51 in Sprint 2, 74 in Sprint 3, and 58 in Sprint 4.

## 2. What Went Well

- **Security Was Addressed Comprehensively:** The team delivered a broad security hardening effort this sprint. Password hashing with bcrypt was applied across the authentication flow, session security was hardened, and server-side input validation with output encoding was added throughout the application. New students and staff must now verify their email address before logging in, with a styled verification email, token expiry, and a resend option. Failed login attempts are tracked and accounts are locked out after repeated failures, with a one-time PIN sent by email to unlock access. Students and staff can also request a secure token-based password reset link. These improvements collectively brought the system to a much more production-ready standard and addressed the security gaps that had been flagged as outstanding since Sprint 3.

- **Cancellation of Meetings Was Completed:** Students can now cancel consultations they have created. The cancellation enforces a two-hour restriction, meaning students cannot cancel a consultation that is starting within two hours. This was a story that had been partially stubbed in Sprint 3 and was correctly completed and tested in this final sprint.

- **Activity Log Was Delivered and Improved:** A unified activity log was built and surfaced in the admin dashboard. The log captures important user actions including bookings, cancellations, and failed login attempts. Gaps in the original logging implementation were also identified and fixed, making the audit trail more complete.

- **Admin Undo Feature Was Completed:** The admin can now undo recent record deletions from the audit log view. This adds an important safety net for administrative actions and was a five-point story delivered fully with tests.

- **Directional Feedback for Login Failure Was Finally Delivered:** This story was moved to the backlog at the end of Sprint 3. It was completed early in Sprint 4, giving users clearer and more helpful error messages when login fails.

- **Booking Edge Cases and Race Conditions Were Fixed:** The team enforced the maximum booking window constraint and fixed race conditions in the booking flow. These fixes improved the reliability and fairness of the consultation booking system before final submission.

- **Peer Review Feedback Was Fully Addressed:** The team worked through all peer review feedback and shipped a dedicated fixes branch. This included zero-course validation, logout confirmation, the two-hour cancellation restriction, and several UI improvements. A written response was also documented.

- **Test Suite Grew Significantly:** The project finished with 492 automated tests across 45 test suites, more than double the 229 tests that were in place at the end of Sprint 3. Unit tests, integration tests, and E2E tests were all extended to cover new security flows, booking edge cases, and cancellation behaviour. The team maintained coverage above 90% throughout the sprint and added targeted tests specifically to address gaps raised during the peer review. This is one of the strongest indicators that the system was built with quality in mind.

- **Realistic Demo Data Was Seeded:** The database was seeded with a complete and realistic set of demo data. This ensured the submitted application looks and behaves like a real consultation scheduling platform when assessed.

- **First Login Course Setup Redirect Was Added:** New students and lecturers are now redirected to the course setup page on first login. This guides users through completing their profile before accessing the rest of the system.

- **Architectural Decisions Were Well Documented:** The team produced 14 Architecture Decision Records across the project, covering decisions from the initial database schema and technology stack choices through to security hardening, booking flow design, admin audit logging, and deployment persistence. Keeping these decisions recorded gave the team a shared reference point when new work touched established design choices and ensures the rationale behind the system architecture is clear to anyone reading the codebase.

- **The Application Has a Persistent Database:** Despite the difficulties encountered with Render's ephemeral storage, the team ultimately ensured that the submitted application is backed by a persistent database. Data survives across deploys and the system behaves correctly as a live hosted application rather than a temporary demo.

- **A Consistent PR and Branching Workflow Was Maintained Across All Four Sprints:** The team used a trunk-based development approach with focused feature branches and pull request reviews throughout the entire project. Every change went through a PR before reaching main, and reviews were conducted attentively across all sprints. This discipline kept the main branch stable and gave the team a reliable baseline to build from at the start of each sprint.

## 3. What Did Not Go Well

- **Merge Conflicts Were Frequent and Costly:** The security stories all touched the same core files, particularly the authentication controller, the database schema, and the session configuration. Because multiple team members worked on these areas simultaneously, merge conflicts arose often and required careful resolution. This added overhead to every integration and slowed the overall pace of the sprint.

- **Time During the Week Was Difficult to Find:** All three team members had competing academic commitments throughout the sprint. This meant that productive development time was concentrated into shorter windows, which increased pressure when blockers arose and reduced the team's ability to review work incrementally.

- **Work Was Still Concentrated Near the End of the Sprint:** Despite action items from Sprint 3, a significant volume of work still landed in the final days before submission. This is a pattern the team recognised across all four sprints. While the submitted product was complete and stable, earlier distribution of work would have allowed more time for integration testing and review.

- **The Render Persistence Issue Consumed Significant Time and Energy:** The team spent a considerable amount of time investigating why data was not persisting between deployments on Render. This created real distress during the sprint, as it was unclear whether the system had a bug or a configuration problem. The team explored numerous potential free-tier solutions before ultimately concluding that none were viable and that upgrading to a paid plan was the only reliable option. Even with the paid plan, SQLite is not ideally suited to Render's environment, which means the deployment trade-offs remain. The time and stress spent reaching that conclusion was a significant cost that earlier research into the platform's constraints could have avoided.

- **The Max Consultations Per Day Feature Was Not Completed:** Work on limiting the number of consultations a lecturer can host per day was started on a dedicated branch but was not merged into main before the submission deadline. This was a conscious trade-off. With the deadline approaching and the branch still requiring additional testing, the team made the deliberate decision to protect the stability of the submitted product rather than risk introducing regressions. The core booking and availability system is fully functional, and this constraint would have been the next logical enhancement given more time.

## 4. Overall Project Reflection

- **The Team Delivered a Complete Product:** Across four sprints, the team built a fully functional consultation scheduling platform. Students can discover, book, join, and cancel consultations. Lecturers can manage their availability and view their consultation schedule. Admins can manage all system records, view the activity log, and undo recent deletions. The system is secured with hashed passwords, session hardening, input validation, email verification, and login lockout. This is a result the team can be proud of.

- **Incremental Progress Was Difficult to Maintain:** The team consistently struggled to distribute work evenly across the sprint. Work tended to accumulate near the deadline, which created avoidable pressure. In a professional setting, more disciplined use of daily stand-ups and mid-sprint check-ins would help address this pattern.

- **Security and Quality Work Should Be Planned Earlier:** Security hardening, activity logging, and edge-case fixes consistently became Sprint 4 concerns. In future projects, these should be built into the definition of done for each feature rather than addressed in a dedicated final sprint.

- **Scope Management Improved Over Time:** The team's ability to estimate and break down stories improved with each sprint. Sprint 1 and Sprint 2 stories were often too vague or too large. By Sprint 4, the team had a much clearer sense of what a manageable story looks like. This is a skill that will carry forward into future projects.
