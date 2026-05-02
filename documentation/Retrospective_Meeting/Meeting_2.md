# Sprint 2 Retrospective Meeting Minutes
Project: KnockKnock.prof Consultation Scheduler \
Course: Software Development III (ELEN4010) \
Institution: University of the Witwatersrand, Johannesburg
Date: 2 May 2026

Attendees :

- Suné Toerien (Sarcastic Sunflower)
- Aditya Raghunandan (Aditya - Raghunandan)
- Thandeka Malasa (ThandiAlgorithm)


1. Sprint Velocity Calculation
- Achieved Velocity: 51 Story Points
- The team completed 51 story points during Sprint 2, a notable improvement over our Sprint 1 baseline of 39. This establishes a stronger sense of the team's capacity and provides a more confident foundation for planning the sprints ahead.

2. What Went Well
- Improved Release Discipline: Unlike Sprint 1, the team met the sprint deadline without a late release. The buffer time action item from our Sprint 1 retrospective was honoured, and this contributed meaningfully to a calmer close to the sprint.
- Significant Normalisation and Refactoring: The team successfully refactored both the lecturer/staff table and the consultation table to third normal form, introducing the course, availability, and attendees junction tables. This was technically demanding work and completing it positions the project on a much stronger data foundation for the remaining sprints.
- Broader Feature Coverage: Several meaningful user facing features landed this sprint, including course and degree selection for students, Wits email domain validation at signup, and a polished homepage with improved navigation and user feedback messages. The seeding of the course, degree, and department catalogue also came together cleanly.
- All Completed Features Fully Functional: Every feature delivered this sprint worked correctly at the point of merging. There were no broken or partially functional stories shipped, which speaks to the rigour applied during development and review before marking anything as Done.
- CI/CD Stability and Healthy Coverage: With the infrastructure permissions issue from Sprint 1 now resolved, the CI pipeline ran smoothly throughout the sprint with the main branch passing cleanly at the close of Sprint 2. Code coverage sits at 82%, which is a solid figure and reflects that the team was writing meaningful tests alongside their features rather than deferring testing to the end.
- Consistent Code Review Culture: The team maintained a healthy rhythm of coding and reviewing each other's pull requests throughout the sprint. Reviews were conducted attentively and feedback was addressed before merging, which kept the codebase in good shape and meant that quality was not sacrificed despite the pressures of the sprint.

3. What Did Not Go Well
- Tightly Coupled Work Allocation: The most significant process problem this sprint was that too many stories had hard sequential dependencies on one another, and we did not account for this during sprint planning. Across the team, multiple features could not begin or be completed until upstream work from a colleague was finalised, and when that upstream work was delayed even slightly, it created a cascading effect that blocked the next person in the chain. This meant that a single delay did not stay isolated; it rippled outward and affected the progress of team members who were otherwise ready to move forward. The root cause was not a lack of effort but rather the way we structured and sequenced the work during planning, leaving too little room for anyone to operate independently when a dependency took longer than expected.
- Competing Academic Pressures: Sprint 2 coincided with other course submissions and deadlines across the team. This reduced the effective hours available per person and amplified the impact of any delays. When a blocker appeared, there was less slack time available to absorb it compared to a sprint where the team could give their full attention to the project.
- Stories Carried Over Past the Deadline: Not all planned stories were closed before the sprint deadline. While the team made good progress overall, the carryover reflects the impact of the dependency issues and competing pressures described above. The team recognises that this is an area requiring direct attention in how work is planned and sequenced going forward.

4. Action Items for Next Sprint 
- Design for Parallelism During Sprint Planning: The team will actively map out story dependencies at the start of Sprint 3 before assigning work. Where one story is a prerequisite for another, the dependent story should either be deferred to a later sprint or the team should agree on a stub or interface contract that allows parallel development to proceed without waiting for the upstream work to be fully merged. No team member should be in a position mid sprint where they cannot make progress because they are waiting on a colleague.
- Decouple Where Possible: For database facing stories in particular, the team will explore creating lightweight mock data or provisional table structures early in the sprint so that frontend and feature work is not gated on the final production schema being in place.
- Blockers Must Be Raised Immediately: If any team member finds themselves waiting on upstream work, this must be raised with the team at the earliest opportunity rather than absorbing the delay silently. Early visibility of a blocker gives the team the chance to reprioritise or reassign work before it cascades.
- Sprint Planning Around Academic Calendar: Going forward, the team will check the broader academic calendar before committing to a sprint scope. Where a sprint week overlaps with other submission deadlines, the planned velocity will be adjusted downward to reflect realistic availability, rather than committing to a full load and finding the team stretched.