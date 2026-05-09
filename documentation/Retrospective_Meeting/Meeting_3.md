# Sprint 3 Retrospective Meeting Minutes

**Project:** KnockKnock.prof Consultation Scheduler  
**Course:** Software Development III (ELEN4010)  
**Institution:** University of the Witwatersrand, Johannesburg  
**Date:** 09 May 2026  

## Attendees

- Suné Toerien (Sarcastic Sunflower)
- Aditya Raghunandan (Aditya-Raghunandan)
- Thandeka Malasa (ThandiAlgorithm)

## 1. Sprint Velocity Calculation

**Achieved Velocity:** 74 Story Points

The team completed 74 story points in Sprint 3, which is a strong increase from the Sprint 2 velocity of 51 story points. Sprint 3 was the most feature-heavy sprint so far. The team completed major student booking functionality, a full admin management dashboard, E2E testing, UI improvements, signup fixes, and availability form corrections. This brought the system much closer to a complete working product before the final project deadline.

## 2. What Went Well

- **Core Booking Flow Completed:** The team delivered the main student booking experience. Students can now find available consultation slots, view course details, select a booking time, choose a duration, make a booking, and see the consultation on their dashboard. This is one of the most important parts of the whole application.

- **Joinable Consultations Added:** The team added the ability for students to join consultations where joining is allowed and spaces are still available. The consultation detail page now shows useful information such as the lecturer, organiser, attendees, date, time, venue, and remaining spots.

- **Student Dashboard Improved:** The student dashboard now includes a 10-day consultation discovery calendar. This makes it easier for students to find available consultations across their enrolled courses. The calendar uses colours to make the different courses easier to identify.

- **Course Detail Pages Added:** Students can now click into a course and see the lecturers and their available consultation times. This improves the discovery process and gives students more context before booking.

- **Admin Dashboard Became Fully Functional:** The admin dashboard was significantly improved this sprint. Admins can now view, add, edit, delete, search, and manage system records more effectively. Foreign key dropdowns, clearer input fields, and better error messages also made the admin system easier to use.

- **E2E Testing Was Added:** Playwright tests were added for the main flows, including login, lecturer dashboard access, and the student booking flow. This gives the team more confidence that the application works from the user’s perspective.

- **Strong Test Coverage Maintained:** The team ended the sprint with strong automated test results. The project had 229 passing Jest tests across 28 test suites, 95.5% line coverage, and 3 passing E2E tests. This gave the team confidence that the main features were working correctly before the final sprint.

- **UI Polish Improved the App:** The team added several visual improvements, including role-specific greetings, dashboard animations, login button animation, course card hover effects, and an improved colour palette. These changes made the application feel more complete and polished.

- **Availability Form Issues Were Fixed:** Missing or incomplete availability fields were corrected. This improved the reliability of lecturer availability and reduced the chance of incorrect data being saved.

- **Signup Flow Was Completed:** The signup flow was improved with better success messages, clearer error messages, and correct dashboard routing based on user role.

## 3. What Did Not Go Well

- **Work Was Still Concentrated Near the End:** A large amount of work landed on the final day of the sprint. Although the completed work was strong, this created pressure near the deadline and left less time to catch integration issues early.

- **Several Fixes Were Reactive:** Some problems were only found after features had already been built. These included availability form issues, CI setup problems, E2E test mismatches, booking date fixes, and admin table issues. Earlier full-flow testing may have helped catch these sooner.

- **Admin Work Became More Complex Than Expected:** The admin dashboard required several rounds of fixes and improvements. It started as a basic management dashboard but grew to include search, record protection, foreign key dropdowns, better input types, friendly error messages, and edit/delete fixes.

- **Booking Flow Was a Large Feature:** The booking flow touched many parts of the system, including the student dashboard, course pages, booking pages, database changes, joining logic, tests, and documentation. The feature was completed successfully, but its size increased the risk of integration problems.

- **Stories Were Not Broken Down Enough:** Some stories were too large for the sprint. The booking functionality had to be expanded into a new user story with two extra developer-sized stories. This shows that the team underestimated the size of the work during sprint planning.

- **Some Planned Work Moved to the Backlog:** The directional feedback for login failure story was not completed in Sprint 3 and was moved back to the backlog. This happened because larger booking and admin stories took more time than expected.

- **Schema Changes Required Coordination:** The booking work added new database fields, meaning teammates needed to run `npm run setup` after pulling the changes. This creates a risk when team members are not aware that their local database needs to be updated.

- **Security, Persistence, and Auditing Need More Attention:** Sprint 3 focused heavily on feature delivery, so Sprint 4 needs to focus more on security, data persistence, testing, and auditing. The activity log table should also be added to track important user actions.

- **PR Reviews Need to Follow the Guides More Closely:** Pull requests were reviewed, but the team should make more deliberate use of the coding and review guides. This is important because the rubric expects strong review practice for excellent performance.

- **Some Follow-Up Work Remains:** Cancel and Leave actions were added as visible options, but their full behaviour was left for follow-up stories. These need to be completed or handled carefully before the final submission.

## 4. Action Items for Next Sprint

- **Enforce Mid-Sprint Integration Testing:** Each team member should test their work through the full application before the final day of the sprint. This will help catch issues earlier and reduce last-minute pressure.

- **Push Work More Incrementally:** Team members should push work to their remote branches throughout the sprint instead of waiting until the end. This will make progress easier to track and reduce the risk of late conflicts.

- **Keep Branches Focused:** Each branch should focus on one story or one clearly defined fix. If a story grows too much, the extra work should be moved into a separate branch or follow-up story.

- **Split Large Features Earlier:** Large features like the booking flow should be broken into smaller parts before development begins. This will make story points more accurate and reduce the need to create extra stories late in the sprint.

- **Plan Story Points More Carefully:** During Sprint 4 planning, the team should look more carefully at whether a story involves multiple pages, database changes, routes, tests, and UI work. If it does, it should receive more story points or be split into smaller stories.

- **Communicate Database Changes Clearly:** Any branch that changes the database schema must clearly tell teammates what setup command they need to run after pulling.

- **Complete or Remove Stubbed Features:** The Cancel and Leave consultation actions should be reviewed early in Sprint 4. If they are needed for the final submission, they should be completed and tested. If not, the UI should avoid showing incomplete actions.

- **Review Backlog Items Early:** The directional feedback for login failure story should be reviewed early in Sprint 4. The team should decide whether it is still needed for the final submission or whether it should remain in the backlog.

- **Focus on Security, Persistence, Auditing, and Testing:** Sprint 4 should prioritise system quality. This includes improving security, checking that data is saved correctly, adding an activity log table for user actions, and strengthening tests.

- **Improve PR Review Discipline:** The team should use the coding and review guides more consistently during pull request reviews. Reviews should check functionality, code quality, security, tests, readability, and whether the implementation follows the agreed project standards.